const path = require('path');
const mkdir = require('mkdirp-sync');
const fs = require('fs');
const rimraf = require('rimraf');
const electron = require('electron');
const app = electron.app || require('@electron/remote').app;

function fileNameForKey(key) {
  const keyFileName = path.basename(key, '.json') + '.json';

  // Prevent ENOENT and other similar errors when using
  // reserved characters in Windows filenames.
  // See: https://en.wikipedia.org/wiki/Filename#Reserved%5Fcharacters%5Fand%5Fwords
  const escapedFileName = encodeURIComponent(keyFileName);

  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, escapedFileName);
}

/**
 * @depracted This implementation is not cross-platform use this instead:
 * ```ts
 * import { JSONStorage } from '@noodl/platform';
 * ```
 * 
 * Can't remove this file because it's called from main thread,
 * where the platform code is not setup.
 */
module.exports = {
  get: function (key, callback) {
    var filename = fileNameForKey(key);
    fs.readFile(filename, { encoding: 'utf8' }, function (error, object) {
      if (!error) {
        var objectJSON = {};
        try {
          objectJSON = JSON.parse(object);
        } catch (error) {
          return callback(); //new Error('Invalid data'));
        }
        return callback(objectJSON);
      }

      if (error.code === 'ENOENT') {
        return callback(JSON.stringify({}));
      }

      return callback();
    });

    /*storage.get(path, function(error, data) {
      if (error) { callback(); return }
      callback(data);
    });*/
  },
  set: function (key, data) {
    var filename = fileNameForKey(key);
    const json = JSON.stringify(data);

    mkdir(path.dirname(filename));
    fs.writeFileSync(filename, json);
  },
  remove: function (key, callback) {
    var filename = fileNameForKey(key);
    rimraf(filename, callback);

    // storage.remove(path,callback);
  }
};
