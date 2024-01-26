import { filesystem, platform } from '@noodl/platform';

import Model from '../../../shared/model';
import JSONStorage from '../../../shared/utils/jsonstorage';
import FileSystem from '../utils/filesystem';
import { guid } from '../utils/utils';
import LessonModel from './lessonmodel';
import { projectFromDirectory, unzipIntoDirectory } from './projectmodel.editor';

export class LessonsProjectsModel extends Model {
  lessonProgress = {};
  projectDirectories = [];

  constructor() {
    super();

    JSONStorage.get('lessonProgress', (local) => {
      if (local.lessonProgress) {
        this.lessonProgress = local.lessonProgress;
        this.notifyListeners('lessonProgressChanged');
      }
    });
  }

  loadLessonProject(lesson, fn, progress, args?) {
    const name = lesson.name;
    const path = platform.getUserDataPath() + '/lessons/' + name;
    if (args && args.restart) {
      // The tutorial should be restarted, remove dir and try again
      FileSystem.instance.removeDirectoryRecursive(path, () => {
        this.loadLessonProject(lesson, fn, progress);
      });
      return;
    }

    FileSystem.instance.makeDirectory(path, (r) => {
      if (r.result === 'failure') {
        fn();
        return;
      }

      FileSystem.instance.isDirectoryEmpty(path, (isEmpty) => {
        if (isEmpty) this._cloneLessonIntoDirectory(lesson, path, fn);
        else {
          // Lesson is started
          projectFromDirectory(path, (project) => {
            if (!project) {
              return;
            }
            project.id = guid();
            this._trackLessonProgress(project, name);
            fn(project);
          });
        }
      });
    });
  }

  _trackLessonProgress(project, name) {
    const lesson = project.getLessonModel();
    if (lesson) {
      lesson.on('instructionsChanged', () => {
        this.lessonProgress[name] = { index: lesson.index, end: lesson.numberOfLessons };
        JSONStorage.set('lessonProgress', { lessonProgress: this.lessonProgress });
        this.notifyListeners('lessonProgressChanged');
      });
    }
  }

  _cloneLessonIntoDirectory(lesson, dirEntry, callback) {
    const url = lesson.url;

    unzipIntoDirectory(
      url,
      dirEntry,
      (r) => {
        if (r.result !== 'success') {
          callback(r);
          return;
        }

        const baseURL = url.split('/').slice(0, -1).join('/') + '/'; // Base Url, e.g. location of project zip file
        if (!r.project.lesson) {
          r.project.lesson = new LessonModel({
            baseURL: baseURL,
            index: 0,
            url: 'lesson.html',
            name: lesson.name
          });
        } else {
          r.project.lesson.baseURL = baseURL;
          r.project.lesson.index = 0; // Reset index
        }

        r.project.id = guid();
        this._trackLessonProgress(r.project, lesson.name);
        callback(r.project);
      },
      { noAuth: true }
    );
  }

  restartLessonProject(lesson, fn, progress) {
    this.loadLessonProject(lesson, fn, progress, { restart: true });
  }

  getLessonProjectProgress(url) {
    return this.lessonProgress[url];
  }
}
