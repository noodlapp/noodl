import { ProjectItem, LocalProjectsModel } from '@noodl-utils/LocalProjectsModel';
import ProjectImporter from '@noodl-utils/projectimporter';

import Model from '../../../shared/model';
import { EventDispatcher } from '../../../shared/utils/EventDispatcher';
import { ViewerConnection } from '../ViewerConnection';
import ImportPopup from '../views/importpopup';
import PopupLayer from '../views/popuplayer';
import { ToastLayer } from '../views/ToastLayer/ToastLayer';

const ImportOverwritePopupTemplate = require('../templates/importoverwritepopup.html');
const ImportPopupTemplate = require('../templates/importpopup.html');

export class ProjectLibraryModel extends Model {
  static instance: ProjectLibraryModel;

  constructor() {
    super();
  }

  async importProject(projectEntry: ProjectItem, onBeforePopup?: () => void, onAfterPopup?: () => void) {
    const dirEntry = await this.getProjectRootDir(projectEntry)
      .then((project) => project)
      .catch(console.log);

    // project._retainedProjectDirectory

    const activityId = 'import-activity';
    ToastLayer.showActivity('Importing...', activityId);

    return new Promise((resolve, reject) => {
      ProjectImporter.instance.listComponentsAndDependencies(dirEntry, async (imports) => {
        function doImport(selectedImports) {
          ViewerConnection.instance.setWatchModelChangesEnabled(false);
          ProjectImporter.instance.import(dirEntry, selectedImports, function (r) {
            ViewerConnection.instance.setWatchModelChangesEnabled(true);

            ToastLayer.hideActivity(activityId);

            if (r.result !== 'success') {
              reject({ message: r.message });
              PopupLayer.instance.hideAllModalsAndPopups();
            }

            // Reload the viewer
            EventDispatcher.instance.emit('viewer-refresh');
            EventDispatcher.instance.emit('ProjectModel.importComplete');

            resolve(true);
            PopupLayer.instance.hideAllModalsAndPopups();
          });
        }

        onBeforePopup && onBeforePopup();

        const chooseImportsPopup = new ImportPopup({
          template: ImportPopupTemplate,
          imports,
          onOk: function () {
            // User have made choice of what to import, check if there are any collisions
            const selectedImports = chooseImportsPopup.getSelectedImports();
            ProjectImporter.instance.checkForCollisions(selectedImports, function (collisions) {
              if (collisions === undefined) {
                // No collisions
                doImport(selectedImports);
              } else {
                ToastLayer.hideActivity(activityId);

                // There is a collision for import, promt user if we should overwrite
                var overwritePopup = new ImportPopup({
                  template: ImportOverwritePopupTemplate,
                  initAllAsImport: true,
                  ignoreDependencies: true,
                  imports: collisions,
                  onOk: function () {
                    onAfterPopup && onAfterPopup();
                    ProjectImporter.instance.filterImports(selectedImports, {
                      remove: overwritePopup.getUnselectedImports()
                    });
                    doImport(selectedImports);
                  },
                  onCancel: function () {
                    onAfterPopup && onAfterPopup();
                    PopupLayer.instance.hideModal(undefined);
                    reject({ message: 'Cancelled import' });
                  }
                });
                overwritePopup.render();

                PopupLayer.instance.showModal({
                  content: overwritePopup
                });
              }
            });
          },
          onCancel: function () {
            onAfterPopup && onAfterPopup();
            PopupLayer.instance.hideModal(undefined);
            reject({ message: 'Cancelled import' });
          }
        });

        chooseImportsPopup.render();

        ToastLayer.hideActivity(activityId);
        PopupLayer.instance.showModal({
          content: chooseImportsPopup
        });
      });
    });
  }

  private async getProjectRootDir(projectItem: ProjectItem) {
    console.log(projectItem);
    const activityId = 'getting-root';

    ToastLayer.showActivity('Loading project', activityId);
    const project = await LocalProjectsModel.instance.loadProject(projectItem);
    ToastLayer.hideProgress(activityId);

    if (project) {
      return project._retainedProjectDirectory;
    } else {
      throw new Error('Couldnt load project');
    }
  }
}

ProjectLibraryModel.instance = new ProjectLibraryModel();
