var _ = require('underscore'),
  Path = require('path');
var mkdirp = require('mkdirp');
var JSZip = require('jszip');
var fs = require('fs');
var md5File = require('md5-file');
var fse = require('fs-extra');

const { dialog } = require('@electron/remote');

//OSX and Windows add trailing slashes to the temp folder, Linux doesn't
function addTrailingSlash(path) {
  return path[path.length - 1] !== '/' ? path + '/' : path;
}

var userDataPath = require('@electron/remote').app.getPath('userData');
var documentsPath = require('@electron/remote').app.getPath('documents');
var tempPath = addTrailingSlash(require('@electron/remote').app.getPath('temp'));
var appPath = addTrailingSlash(require('@electron/remote').app.getAppPath());

var FileSystem = new (function () {})();

FileSystem.instance = {
  promises: {
    readFile(path) {
      return fs.promises.readFile(path, 'utf8');
    },
    async readJSONFile(path) {
      const fileContent = await fs.promises.readFile(path, 'utf8');
      return JSON.parse(fileContent);
    },
    writeFile(path, content) {
      return fs.promises.writeFile(path, Buffer.from(content));
    },
    // TODO: This can be done with a flag?
    async writeFileOverride(path, content) {
      try {
        await this.removeFile(path);
      } catch (error) {
        // noop
      }

      await this.writeFile(path, content);
    },
    removeFile(path) {
      return fs.promises.unlink(path);
    }
  },

  getUserDataPath: function () {
    return userDataPath;
  },
  getDocumentsPath: function () {
    return Path.join(documentsPath, '/Noodl/');
  },
  getTempPath: function () {
    return tempPath;
  },
  getAppPath: function () {
    return appPath;
  },
  readJSONFile: function (path, callback) {
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        callback();
        return;
      }

      let json;
      try {
        json = JSON.parse(data);
      } catch (e) {
        callback();
      }

      if (json) {
        callback(json);
      }
    });
  },
  readTextFile: function (path, callback) {
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        callback();
        return;
      }

      callback(data);
    });
  },
  readFileSync: function (path, opts) {
    return fs.readFileSync(path, opts);
  },
  md5ForFileSync: function (path) {
    return md5File.sync(path);
  },
  writeJSONFile: function (path, json, callback) {
    try {
      fs.writeFileSync(path, JSON.stringify(json, null, 4));
      callback && callback({ result: 'success' });
    } catch (e) {
      console.log('Error writing json file', e);
      callback && callback({ result: 'failure', message: e.toString() });
    }
  },
  writeFileSync: function (path, content) {
    fs.writeFileSync(path, content);
  },
  writeFile: function (path, content, callback) {
    fs.writeFile(path, Buffer.from(content), function (err) {
      if (err) {
        callback({ result: 'failure' });
      } else {
        callback({ result: 'success' });
      }
    });
  },
  removeFile: function (path, callback) {
    fs.unlink(path, function (err) {
      if (err) {
        callback({ result: 'failure' });
      } else {
        callback({ result: 'success' });
      }
    });
  },
  removeFileSync: function (path) {
    return fs.unlinkSync(path);
  },
  getFileMetadata: function (path, callback) {
    fs.stat(path, function (err, stats) {
      if (err) callback();
      else {
        callback({
          modificationTime: stats.mtime
        });
      }
    });
  },
  getFileDirectoryName: function (path) {
    return Path.dirname(path);
  },
  downloadAsDataURI: function (url, callback, options) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    if (options && options.headers) {
      for (var key in options.headers) {
        xhr.setRequestHeader(key, options.headers[key]);
      }
    }
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
      if (this.status === 200) {
        callback(URL.createObjectURL(this.response));
      } else callback();
    };
    xhr.onerror = function () {
      callback();
    };
    xhr.responseType = 'blob';
    xhr.send();
    /*datauri.encode(path, function(err, content) {
      if(err) callback();
      else callback(content);
    });*/
  },
  copyFile: function (source, target, callback) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on('error', function (err) {
      done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on('error', function (err) {
      done(err);
    });
    wr.on('close', function (ex) {
      done();
    });
    rd.pipe(wr);

    function done(err) {
      if (!cbCalled) {
        if (err) callback({ result: 'failure' });
        else callback({ result: 'success' });
        cbCalled = true;
      }
    }
  },
  readDirectory: function (path, callback) {
    fs.readdir(path, function (err, files) {
      if (err) callback();
      else
        callback(
          files.map(function (f) {
            return {
              fullPath: path + '/' + f,
              name: f,
              isDirectory: fs.lstatSync(path + '/' + f).isDirectory()
            };
          })
        );
    });
  },
  readDirectorySync: function (path) {
    return fs.readdirSync(path).map(function (f) {
      return {
        fullPath: path + '/' + f,
        name: f,
        isDirectory: fs.lstatSync(path + '/' + f).isDirectory()
      };
    });
  },
  makeDirectory: function (path, callback) {
    if (path.length === 0 || fs.existsSync(path)) {
      callback({ result: 'success' });
      return;
    }

    mkdirp(path, function (err) {
      if (err) callback({ result: 'failure', err: err });
      else callback({ result: 'success' });
    });
  },
  /**
   * makeDirectoryAsync with promise
   * @param {string} path
   * @returns {Promise<void>}
   */
  makeDirectoryAsync(path) {
    if (path.length === 0 || fs.existsSync(path)) {
      return;
    }

    return new Promise((resolve, reject) => {
      mkdirp(path, function (err) {
        if (err) reject({ result: 'failure', err: err });
        else resolve({ result: 'success' });
      });
    });
  },
  makeDirectorySync: function (path, callback) {
    mkdirp.sync(path);
  },
  listFilesRecursiveSync: function (dir, _objects, _rootDir) {
    var objects = _objects || {};
    var rootDir = _rootDir || dir;

    if (!FileSystem.instance.fileExistsSync(dir)) return objects;

    var files = FileSystem.instance.readDirectorySync(dir);

    if (!files) {
      return objects;
    }

    const ignore = { '.DS_Store': true, '.git': true, __MACOSX: true };

    for (var i = 0; i < files.length; i++) {
      var f = files[i];

      if (ignore[f.name]) continue;

      var stats = FileSystem.instance.stat(f.fullPath);
      if (stats.isDirectory()) {
        FileSystem.instance.listFilesRecursiveSync(f.fullPath, objects, rootDir);
      } else {
        objects[f.fullPath.substring(rootDir.length)] = true;
      }
    }

    return objects;
  },
  syncDirsRecursiveSync: function (src, dst) {
    const srcFiles = FileSystem.instance.listFilesRecursiveSync(src);
    const dstFiles = FileSystem.instance.listFilesRecursiveSync(dst);
    const allFiles = {};
    for (var key in srcFiles) allFiles[key] = true;

    for (var key in dstFiles) allFiles[key] = true;

    var errors = [];
    for (var key in allFiles) {
      if (srcFiles[key] === undefined) {
        // Remove file
        try {
          FileSystem.instance.removeFileSync(Path.join(dst, key));
        } catch (e) {
          errors.push(e);
        }
      } else {
        try {
          FileSystem.instance.copyRecursiveSync(Path.join(src, key), Path.join(dst, key));
        } catch (e) {
          errors.push(e);
        }
      }
    }

    if (errors.length > 0) {
      const e = new Error('There were errors during sync');
      e.syncFileErrors = erros;
      throw e;
    }
  },
  copyRecursiveSync: function (src, dest, options) {
    /* var _this = this;

    if(src === dest) {
      callback();
      return;
    }

    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (exists && isDirectory) {
      mkdirp.sync(dest);
      fs.readdirSync(src).forEach(function(childItemName) {
        _this.copyRecursive(Path.join(src, childItemName),
                          Path.join(dest, childItemName));
      });
    } else {
      fs.linkSync(src, dest);
    }*/

    fse.copySync(src, dest, options);
  },
  removeDirectoryRecursiveSync: function (path) {
    fse.removeSync(path);
  },
  removeDirectoryRecursive: function (path, callback) {
    var _this = this;
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function (file, index) {
        var curPath = Path.join(path, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          // recurse
          _this.removeDirectoryRecursive(curPath);
        } else {
          // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
    callback && callback();
  },
  isPathDirectory: function (path) {
    return fs.lstatSync(path).isDirectory();
  },
  isDirectoryEmpty: function (path, callback) {
    this.readDirectory(path, function (files) {
      if (files.length === 0) callback(true);
      else callback(false);
    });
  },
  isDirectoryEmptySync: function (path) {
    const files = this.readDirectorySync(path);
    return files === undefined || files.length === 0;
  },
  unzipToFolder: function (path, blob, callback) {
    var _this = this;

    JSZip.loadAsync(blob)
      .then(function (zip) {
        var numFiles = Object.keys(zip.files).length;
        var err = false;
        function fileCompleted() {
          numFiles--;
          if (numFiles === 0) {
            if (err) callback({ result: 'failure' });
            else callback({ result: 'success' });
          }
        }

        Object.keys(zip.files).forEach(function (filename) {
          if (zip.files[filename].dir) {
            fileCompleted();
            return;
          } // Ignore dirs

          zip
            .file(filename)
            .async('nodebuffer')
            .then(
              function (buffer) {
                var dest = Path.join(path, filename);
                _this.makeDirectory(Path.dirname(dest), function (r) {
                  if (r.result !== 'success') fileCompleted(false);
                  else {
                    fs.writeFileSync(dest, buffer);
                    fileCompleted();
                  }
                });
              },
              function error(e) {
                err = e;
                fileCompleted(false);
              }
            );
        });
      })
      .catch(function (e) {
        callback({ result: 'failure' });
      });
  },
  fileExists: function (path, callback) {
    fs.exists(path, callback);
  },
  fileExistsSync: function (path) {
    return fs.existsSync(path);
  },
  makeUniquePath: function (path) {
    var _path = path;
    var count = 1;
    while (fs.existsSync(_path)) {
      _path = path + '-' + count;
      count++;
    }
    return _path;
  },
  rename: function (oldPath, newPath) {
    fs.renameSync(oldPath, newPath);
  },
  fileEntryFromPath: function (path) {
    return { fullPath: path, name: Path.basename(path), isDirectory: fs.lstatSync(path).isDirectory() };
  },
  stat: function (path) {
    return fs.lstatSync(path);
  },
  getFileCountAndTotalSize: function (dirPath) {
    const files = fs.readdirSync(dirPath);

    const info = { count: 0, size: 0 };

    files.forEach((file) => {
      const p = Path.join(dirPath, file);
      if (fs.statSync(p).isDirectory()) {
        const _info = this.getFileCountAndTotalSize(p);
        info.size += _info.size;
        info.count += _info.count;
      } else {
        info.count++;
        info.size += fs.statSync(p).size;
      }
    });

    return info;
  },
  chooseDirectory: function (callback, args) {
    const properties = ['openDirectory'];
    if (args && args.allowCreateDirectory) {
      properties.push('createDirectory');
    }

    dialog.showOpenDialog({ properties }).then((res) => {
      if (res.canceled) {
        callback();
      } else {
        callback(res.filePaths[0]);
      }
    });
  },
  chooseFile: function (callback, options) {
    $('#__hiddenFileInput__').remove();
    $('body').append('<input style="display:none" id="__hiddenFileInput__"  type="file" accept="application/json"  />');

    var hiddenFileInput = $('#__hiddenFileInput__');
    hiddenFileInput.one('change', function () {
      var files = _.pluck($('#__hiddenFileInput__')[0].files, 'path');
      $('#__hiddenFileInput__').remove();

      callback(files[0]);
    });
    hiddenFileInput.click();
  },
  forEachFileRecursive: function (startPath, callback) {
    if (!fs.existsSync(startPath)) return;

    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
      var filename = Path.join(startPath, files[i]);
      var stat = fs.lstatSync(filename);
      if (stat.isDirectory()) {
        var abort = this.forEachFileRecursive(filename, callback); //recurse
        if (abort) return true;
      } else {
        var abort = callback(files[i], startPath);
        if (abort) return true;
      }
    }
  }
};

module.exports = FileSystem;
