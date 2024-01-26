import { bugtracker } from '@noodl-utils/bugtracker';
import FileSystem from '@noodl-utils/filesystem';
import Model from '../../../shared/model';
import PopupLayer from '../views/popuplayer';
import { ToastLayer } from '../views/ToastLayer/ToastLayer';
import { CloudServiceMetadata, CloudServiceMetadataDataFormat, ProjectModel } from './projectmodel';
import { applyPatches } from '@noodl-models/ProjectPatches/applypatches';
import { filesystem } from '@noodl/platform';

const supportedProjectVersion = 4;

export function projectFromDirectory(projectdir: string, callback: (project?: ProjectModel) => void, args?: TSFixme) {
  bugtracker.debug('ProjectModel.fromDirectory');

  ProjectModel.readJSONFromDirectory(projectdir, function (content) {
    if (content) {
      const openProject = () => {
        // Before opening the project, we need to patch it, if necessary
        applyPatches(content)

        // Disable model listeners while loading project, otherwise this will bog down large projects
        Model._listenersEnabled = false;
        const project = ProjectModel.fromJSON(content);
        Model._listenersEnabled = true;
        project._retainedProjectDirectory = projectdir;

        // Check if there are any packages
        project.readModules( () => {
          callback(project);
        });
      };

      //is project version incompatible?
      if (content.version > supportedProjectVersion) {
        ToastLayer.hideAll();
        PopupLayer.instance.showErrorModal({
          message:
            'This project was saved with a newer version of Noodl.<br/><a href="https://noodl.net" target="_blank">Click here to download</a>',
          title: 'Error opening project'
        });
        callback();
        return;
      }

      //do we need to upgrade the project?
      if (args && args.showUpgradeModal && content.version < supportedProjectVersion) {
        ToastLayer.hideAll();
        PopupLayer.instance.showConfirmModal({
          message:
            'This project was saved with an older version of Noodl.<br/>Projects saved with with this version of Noodl will be incompatible with older versions.<br/><br/>Do you want to open and upgrade the project?',
          title: 'Upgrade project?',
          confirmLabel: 'Upgrade',
          cancelLabel: 'Cancel',
          onConfirm: openProject,
          onCancel: () => callback()
        });
      } else {
        openProject();
      }
    } else {
      bugtracker.track('ProjectModel.fromDirectory readJSONFromDirectory failed', {
        dir: projectdir,
        dirContent: FileSystem.instance.readDirectorySync(projectdir)
      });
      callback(); // Failed to read project
    }
  });
}

// Extracts a zip into a directory and returns the project in a callback
// TODO: Replace partly with Filesystem.instance.unzipIntoDirectory
export async function unzipIntoDirectory(
  url: string,
  dirEntry: string,
  callback,
  args?: {
    noAuth?: boolean;
    skipLoad?: boolean;
  }
) {
  // Make sure the folder is empty
  const isEmpty = await filesystem.isDirectoryEmpty(dirEntry);
  if (!isEmpty) {
    callback({
      result: 'failure',
      message: 'Folder must be empty'
    });
    return;
  }

  // Load zip file from URL
  try {
    await filesystem.unzipUrl(url, dirEntry);
  }
  catch(e) {
    callback({
      result: 'failure',
      message: 'Failed to extract'
    });
    return;
  }

  if (args && args.skipLoad) {
    // Skip loading the project?
    callback({
      result: 'success',
      dirEntry: dirEntry
    });
    return;
  }

  // Project extracted successfully, load it
  projectFromDirectory(dirEntry, function (project) {
    if (!project) {
      callback({
        result: 'failure',
        message: 'Failed to load project'
      });
      return;
    }

    // Store the project again, this will make it a unique project by
    // forcing it to generate a project id
    project.id = undefined;
    //project.name = dirEntry.split('/').pop();
    project.toDirectory(project._retainedProjectDirectory, function (res) {
      if (res.result === 'success')
        callback({
          result: 'success',
          project: project
        });
      else
        callback({
          result: 'failure',
          message: 'Failed to clone project'
        });
    });
  });
}

export function setCloudServices(project: ProjectModel, b: CloudServiceMetadata) {
  project.setMetaData('cloudservices', <CloudServiceMetadataDataFormat>{
    instanceId: b.id,
    endpoint: b.endpoint || b.url,
    appId: b.appId
  });

  project.notifyListeners('cloudServicesChanged');
}

export function getCloudServices(project: ProjectModel): CloudServiceMetadata {
  const cloudServices = project.getMetaData('cloudservices');
  if (!cloudServices) {
    return {
      id: undefined,
      endpoint: undefined,
      appId: undefined
    };
  }

  return {
    id: cloudServices.instanceId,
    endpoint: cloudServices.endpoint,
    appId: cloudServices.appId
  };
}
