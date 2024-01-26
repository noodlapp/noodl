const fs = require('fs');
const { app } = require('electron');

const { readMergeDriverOptionsSync, cleanMergeDriverOptionsSync } = require('@noodl/git/src/merge-driver');

function datePathExt(date) {
  return date.toUTCString().replace(/[:\ ,]/g, '-');
}

module.exports = {
  handleProjectMerge(args) {
    var mergeArgIndex = args.indexOf('--merge');
    var ancestorFileName = process.argv[mergeArgIndex + 1];
    var currentFileName = process.argv[mergeArgIndex + 2];
    var branchFileName = process.argv[mergeArgIndex + 3];

    const options = readMergeDriverOptionsSync();
    cleanMergeDriverOptionsSync();

    if (ancestorFileName && currentFileName && branchFileName) {
      const { mergeProject } = require('../../editor/src/utils/projectmerger');
      const { applyPatches } = require('../../editor/src/models/ProjectPatches/applypatches');

      console.log('Merging Noodl project');

      // Perform merge
      try {
        let ancestors = {};

        try {
          ancestors = JSON.parse(fs.readFileSync(ancestorFileName, 'utf8'));
          applyPatches(ancestors);
        } catch (e) {
          console.log('failed to parse ancestors project file');
        }

        let ours = JSON.parse(fs.readFileSync(currentFileName, 'utf8'));
        applyPatches(ours);

        let theirs = JSON.parse(fs.readFileSync(branchFileName, 'utf8'));
        applyPatches(theirs);

        if (options.reversed) {
          const tmp = ours;
          ours = theirs;
          theirs = tmp;
        }

        const result = mergeProject(ancestors, ours, theirs);
        //git expects result to be written to the currentFileName path
        fs.writeFileSync(currentFileName, JSON.stringify(result, null, 4));

        app.exit(0);
      } catch (e) {
        // Merge failed, write error to debug log
        console.error('merge failed', e);

        try {
          const date = datePathExt(new Date());
          const userDataPath = app.getPath('userData');
          const logFile = userDataPath + '/debug/git-merge-failed-' + date + '.json';
          fs.writeFileSync(logFile, e.toString());

          const anscestorsDebugFile = userDataPath + '/debug/git-ancestors-merge-project-' + date + '.json';
          const oursDebugFile = userDataPath + '/debug/git-ours-merge-project-' + date + '.json';
          const theirsDebugFile = userDataPath + '/debug/git-theirs-merge-project-' + date + '.json';
          fs.copyFileSync(ancestorFileName, anscestorsDebugFile);
          fs.copyFileSync(currentFileName, oursDebugFile);
          fs.copyFileSync(branchFileName, theirsDebugFile);
        } catch (e) {
          //do nothing if error log fails
        }

        //exit with a failure code
        app.exit(1);
      }
    } else {
      console.log('invalid args', args);
      //exit with a failure code
      app.exit(1);
    }
  }
};
