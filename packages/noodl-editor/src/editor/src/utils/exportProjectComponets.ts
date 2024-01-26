import { ProjectModel } from '@noodl-models/projectmodel';

import { ViewerConnection } from '../ViewerConnection';
import PopupLayer from '../views/popuplayer';
import { ToastLayer } from '../views/ToastLayer/ToastLayer';
import FileSystem from './filesystem';
import ProjectImporter from './projectimporter';
import { guid } from './utils';

const ImportPopup = require('../views/importpopup');
const ExportPopupTemplate = require('../templates/exportpopup.html');
const archiver = require('archiver');
const fs = require('fs');

function _zipFolderContent(options) {
  const output = fs.createWriteStream(options.output);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  function _readDirRec(dir, _res) {
    const res = _res || [];

    const files = fs.readdirSync(dir);
    files.forEach((f) => {
      const stats = fs.statSync(dir + '/' + f);
      if (stats && stats.isDirectory()) {
        _readDirRec(dir + '/' + f, res);
      } else {
        res.push(dir + '/' + f);
      }
    });

    return res;
  }

  return new Promise(function (resolve, reject) {
    const folderPath = options.folder;
    // @ts-expect-error
    const files = _readDirRec(folderPath);
    const f = files.pop();
    archive.file(f, { name: f.substring(folderPath.length + 1) });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
      console.log(err);
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
      reject(err);
    });

    archive.on('entry', function (arg) {
      //console.log(arg.name,arg.sourcePath);
      if (files.length > 0) {
        const f = files.pop();
        archive.file(f, { name: f.substring(folderPath.length + 1) });
      } else {
        archive.finalize();
      }
    });

    output.on('close', function () {
      resolve(undefined);
    });

    // pipe archive data to the file
    archive.pipe(output);
  });
}

export function exportProjectComponents() {
  ProjectImporter.instance.listComponentsAndDependencies(ProjectModel.instance._retainedProjectDirectory, (imports) => {
    const activityId = 'exporting-components';

    // Show popup and allow the user to choose which components to export
    // we reuse the import popup with a new template
    var chooseExportsPopup = new ImportPopup({
      template: ExportPopupTemplate,
      imports: imports,
      onOk: function () {
        ToastLayer.showActivity('Exporting...', activityId);

        // Export to temporary directory
        const exportName = 'export-' + guid();
        const exportDir = FileSystem.instance.getTempPath() + exportName;
        FileSystem.instance.makeDirectorySync(exportDir);
        const project = ProjectModel.fromJSON({
          name: 'Export',
          components: [],
          settings: {},
          version: '3',
          metadata: {},
          variants: []
        });
        project._retainedProjectDirectory = exportDir;

        const selectedExports = chooseExportsPopup.getSelectedImports();
        ViewerConnection.instance.setWatchModelChangesEnabled(false);
        ProjectImporter.instance.import(
          ProjectModel.instance._retainedProjectDirectory,

          selectedExports,
          (r) => {
            ViewerConnection.instance.setWatchModelChangesEnabled(true);
            PopupLayer.instance.hideModal();

            if (r.result !== 'success') {
              ToastLayer.hideActivity(activityId);
              ToastLayer.showError(r.message);
              return;
            }

            project.toDirectory(project._retainedProjectDirectory, (r) => {
              if (r.result !== 'success') {
                ToastLayer.hideActivity(activityId);
                ToastLayer.showSuccess(r.message);
              } else {
                FileSystem.instance.chooseDirectory(function (direntry) {
                  if (!direntry) {
                    ToastLayer.hideActivity(activityId);
                    return;
                  }

                  _zipFolderContent({ folder: exportDir, output: direntry + '/' + exportName + '.zip' })
                    .then(() => {
                      ToastLayer.hideActivity(activityId);
                      ToastLayer.showSuccess('Export successful');
                    })
                    .catch(() => {
                      ToastLayer.hideActivity(activityId);
                      ToastLayer.showError('Failed to create archive');
                    });
                });
              }
            });
          },
          { importIntoProject: project }
        );
      },
      onCancel: function () {
        PopupLayer.instance.hideModal();
      }
    });
    chooseExportsPopup.render();
    chooseExportsPopup.el.css('width', '500px'); // Make it a little bit wider as a modal

    ToastLayer.hideActivity(activityId);
    PopupLayer.instance.showModal({
      content: chooseExportsPopup
    });
  });
}
