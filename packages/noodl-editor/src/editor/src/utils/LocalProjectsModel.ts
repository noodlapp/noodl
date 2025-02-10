import path from 'node:path';
import { GitStore } from '@noodl-store/GitStore';
import Store from 'electron-store';
import { isEqual } from 'underscore';
import {
  RequestGitAccountFuncReturn,
  setRequestGitAccount
} from '@noodl/git/src/core/trampoline/trampoline-askpass-handler';
import { filesystem, platform } from '@noodl/platform';

import { ProjectModel } from '@noodl-models/projectmodel';
import { templateRegistry } from '@noodl-utils/forge';

import Model from '../../../shared/model';
import { projectFromDirectory, unzipIntoDirectory } from '../models/projectmodel.editor';
import FileSystem from './filesystem';
import { tracker } from './tracker';
import { guid } from './utils';
import { getTopLevelWorkingDirectory } from '@noodl/git/src/core/open';

export interface ProjectItem {
  id: string;
  name: string;
  latestAccessed: number;
  thumbURI: string;
  retainedProjectDirectory: string;
}
export class LocalProjectsModel extends Model {
  public static instance = new LocalProjectsModel();

  projectEntries: ProjectItem[] = [];

  private recentProjectsStore = new Store({
    name: 'recently_opened_project'
  });

  async fetch() {
    // Fetch projects from local storage and verify project folders
    const folders = (this.recentProjectsStore.get('recentProjects') || []) as ProjectItem[];

    const existingFolders = folders.filter((x) => filesystem.exists(x.retainedProjectDirectory));

    existingFolders.sort((a, b) => b.latestAccessed - a.latestAccessed);

    if (!this.projectEntries || (this.projectEntries && !isEqual(this.projectEntries, existingFolders))) {
      this.projectEntries = existingFolders;
      this.store();

      this.notifyListeners('myProjectsChanged');
    }
  }

  // Store model to local storage
  store() {
    if (!this.projectEntries) return; // Don't store if projects are not loaded
    this.recentProjectsStore.set('recentProjects', this.projectEntries);
  }

  containsProjectWithId(id) {
    return !!this.projectEntries.find((p) => p.id === id);
  }

  // Get all project directories, sorted
  getProjects() {
    return this.projectEntries;
  }

  getProjectEntryWithId(id: string): ProjectItem {
    return this.projectEntries.find((p) => p.id === id);
  }

  // Update latests accessed time for project
  touchProject(projectEntry: ProjectItem) {
    projectEntry.latestAccessed = Date.now();
    this.store();
    this.notifyListeners('myProjectsChanged');
  }

  // Load a project
  loadProject(projectEntry: ProjectItem) {
    tracker.track('Load Local Project');

    return new Promise<ProjectModel>((resolve, reject) => {
      projectFromDirectory(projectEntry.retainedProjectDirectory, (project) => {
        if (!project) {
          resolve(null);
          return;
        }
        project.id = projectEntry.id; // Assign the project the id stored in the project dir entry
        project.name = projectEntry.name; // Also assign the name
        this.touchProject(projectEntry);
        this.bindProject(project);
        resolve(project);
      });
    });
  }

  // Bind to a loaded project, update model when renamed of when the thumbnail is updated
  bindProject(project: ProjectModel) {
    project
      .off(this)
      .on(
        'renamed',
        () => {
          const projectdir = this.getProjectEntryWithId(project.id);

          if (projectdir) {
            this.renameProject(project.id, project.name ? project.name : 'Untitled');
            project._retainedProjectDirectory = projectdir.retainedProjectDirectory;
          }
        },
        this
      )
      .on(
        'thumbnailChanged',
        () => {
          const projectdir = this.getProjectEntryWithId(project.id);
          if (projectdir) projectdir.thumbURI = project.getThumbnailURI();
          this.store();
        },
        this
      );
  }

  renameProject(id: string, name: string) {
    const projectEntry = this.getProjectEntryWithId(id);
    if (!projectEntry) return;

    projectEntry.name = name;
    this.store();
    this.notifyListeners('myProjectsChanged');
  }

  // Create a new project dir entry
  _addProject(project: ProjectModel) {
    if (!project._retainedProjectDirectory) return;

    // Push directory entry
    const id = guid();
    this.projectEntries.push({
      retainedProjectDirectory: project._retainedProjectDirectory,
      latestAccessed: Date.now(),
      id: id, // Generate a new project id (will be used internally to store project specific local settings)
      name: project.name ? project.name : 'Untitled',
      thumbURI: project.getThumbnailURI()
    });
    project.id = id;

    // Store the project model
    this.bindProject(project);

    this.store();
    this.notifyListeners('myProjectsChanged');
  }

  removeProject(projectId: string) {
    const idx = this.projectEntries.findIndex((p) => p.id === projectId);
    if (idx !== -1) {
      this.projectEntries.splice(idx, 1);
      this.store();
      this.notifyListeners('myProjectsChanged');
    }
  }

  // Given a path to the project zip file locally, unzip it and launch the
  // editor
  _unzipAndLaunchProject(path, dirEntry, fn, options) {
    unzipIntoDirectory(
      path,
      dirEntry,
      (r) => {
        if (r.result !== 'success') {
          fn(r);
          return;
        }

        // Project successfully created
        r.project.name = options.name || 'Untitled';
        this._addProject(r.project);
        fn(r.project);
      },
      { noAuth: true }
    );
  }

  async newProject(
    fn,
    options: {
      name?: string;
      projectTemplate: string;
      path?: string;
    }
  ) {
    tracker.track('New Local Project');

    const name = options?.name || 'Untitled';
    const dirEntry = options?.path || filesystem.makeUniquePath(platform.getDocumentsPath() + name);

    await filesystem.makeDirectory(dirEntry);

    const projectTemplate = options?.projectTemplate;
    if (projectTemplate) {
      const templatePath = await templateRegistry.download({ templateUrl: projectTemplate });

      // Copy unzipped project template
      FileSystem.instance.copyRecursiveSync(templatePath, dirEntry, {
        filter(src) {
          //ignore all files in .git/
          return !src.includes(path.sep + '.git' + path.sep);
        }
      });

      // Project extracted successfully, load it
      projectFromDirectory(dirEntry, (project) => {
        if (!project) {
          fn();
          // callback({
          //   result: 'failure',
          //   message: 'Failed to load project'
          // });
          return;
        }

        project.name = name; //update the name from the template

        // Store the project, this will make it a unique project by
        // forcing it to generate a project id
        this._addProject(project);
        project.toDirectory(project._retainedProjectDirectory, (res) => {
          if (res.result === 'success') {
            fn(project);
            // callback({
            //   result: 'success',
            //   project: project
            // });
          } else {
            fn();
            // callback({
            //   result: 'failure',
            //   message: 'Failed to clone project'
            // });
          }
        });
      });
    } else {
      this._unzipAndLaunchProject('./external/projecttemplates/helloworld.zip', dirEntry, fn, options);
    }
  }

  openProjectFromFolder(direntry: string): Promise<ProjectModel> {
    //check if this project is already in the list and if so just open it
    const projectEntry = this.projectEntries.find((p) => p.retainedProjectDirectory === direntry);
    if (projectEntry) {
      return this.loadProject(projectEntry);
    }

    //project isn't in the list, add it
    return new Promise((resolve, reject) => {
      projectFromDirectory(direntry, (project) => {
        if (!project) {
          reject(null);
          return;
        }

        this._addProject(project);
        resolve(project);
      });
    });
  }

  /**
   * Check if this project is in a git repository.
   *
   * @param project 
   * @returns 
   */
  async isGitProject(project: ProjectModel): Promise<boolean> {
    const gitPath = await getTopLevelWorkingDirectory(project._retainedProjectDirectory);
    return gitPath !== null;
  }

  setCurrentGlobalGitAuth(projectId: string) {
    const func = async (endpoint: string) => {
      if (endpoint.includes('github.com')) {
        const config = await GitStore.get('github', projectId);
        //username is not used by github when using a token, but git will still ask for it. Just set it to "noodl"
        return {
          username: 'noodl',
          password: config?.password
        };
      } else {
        const config = await GitStore.get('unknown', projectId);
        return {
          username: config?.username,
          password: config?.password
        };
      }
    };

    setRequestGitAccount(func);
  }
}
