import fs from 'fs';
import nodePath from 'path';
import fse, { mkdirp } from 'fs-extra';
import JSZip from 'jszip';
import { FileBlob, FileInfo, FileStat, IFileSystem, OpenDialogOptions } from '@noodl/platform';

export class FileSystemNode implements IFileSystem {
  resolve(...paths: string[]): string {
    return nodePath.resolve(...paths);
  }

  join(...paths: string[]): string {
    return nodePath.join(...paths);
  }

  exists(path: string): boolean {
    return fs.existsSync(path);
  }

  dirname(path: string): string {
    return nodePath.dirname(path);
  }

  basename(path: string): string {
    return nodePath.basename(path);
  }

  file(path: string): FileStat {
    const stat = fs.lstatSync(path);
    return { size: stat.size };
  }

  writeFile(path: string, blob: FileBlob): Promise<void> {
    if (typeof blob === 'string') {
      return fs.promises.writeFile(path, Buffer.from(blob));
    }

    return fs.promises.writeFile(path, blob);
  }

  async writeFileOverride(path: string, blob: FileBlob): Promise<void> {
    try {
      await this.removeFile(path);
    } catch (error) {
      // noop
    }

    await this.writeFile(path, blob);
  }

  /**
   * Read file content, with utf-8 encoding.
   *
   * @param path
   * @returns
   */
  readFile(path: string): Promise<string> {
    return fs.promises.readFile(path, 'utf8');
  }

  async readBinaryFile(path: string): Promise<Buffer> {
    const content = await fs.promises.readFile(path, 'binary');
    return Buffer.from(content, 'binary');
  }

  removeFile(path: string): Promise<void> {
    return fs.promises.unlink(path);
  }

  renameFile(oldPath: string, newPath: string): Promise<void> {
    return fs.promises.rename(oldPath, newPath);
  }

  copyFile(from: string, to: string): Promise<void> {
    return fs.promises.copyFile(from, to);
  }

  copyFolder(from: string, to: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fse.copy(from, to, { recursive: true }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Read a JSON file, with utf-8 encoding.
   *
   * @param path
   * @returns
   */
  async readJson<T = any>(path: string): Promise<T> {
    const fileContent = await fs.promises.readFile(path, 'utf8');
    return JSON.parse(fileContent) as T;
  }

  async writeJson(path: string, obj: any): Promise<void> {
    const tmpFileName = path + '.tmp-' + Date.now();

    let jsonText = '';

    try {
      jsonText = JSON.stringify(obj);
    } catch (error) {
      console.log('Error serializing json', error);
      throw error;
    }

    try {
      await fs.promises.writeFile(tmpFileName, jsonText);
      await fs.promises.rename(tmpFileName, path);
    } catch (error) {
      await fs.promises.unlink(tmpFileName);
      console.log('Error writing json file', error);
      throw error;
    }
  }

  /**
   * Returns whether the folder is empty.
   *
   * @param path
   * @returns Returns true, if the folder is empty; Otherwise, false.
   */
  async isDirectoryEmpty(path: string): Promise<boolean> {
    const files = await this.listDirectory(path);
    return files.length === 0;
  }

  /**
   * List all entries in the directory.
   *
   * @param path
   * @returns A list of all entries.
   */
  async listDirectory(path: string): Promise<FileInfo[]> {
    const files = await fs.promises.readdir(path);
    return files.map(function (f) {
      return {
        fullPath: path + '/' + f,
        name: f,
        isDirectory: fs.lstatSync(path + '/' + f).isDirectory()
      };
    });
  }

  /**
   * Returns all the files including all sub folders.
   *
   * @param path
   * @returns
   */
  listDirectoryFiles(path: string): Promise<FileInfo[]> {
    // https://stackoverflow.com/a/5827895
    const walk = function (dir: string, done: (error: unknown, results?: string[]) => void) {
      let results = [];
      fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        let pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
          file = nodePath.resolve(dir, file);
          fs.stat(file, function (err, stat) {
            if (stat && stat.isDirectory()) {
              walk(file, function (err, res) {
                results = results.concat(res);
                if (!--pending) done(null, results);
              });
            } else {
              results.push(file);
              if (!--pending) done(null, results);
            }
          });
        });
      });
    };

    return new Promise<FileInfo[]>((resolve, reject) => {
      walk(path, function (error, files) {
        if (error) {
          reject(error);
        } else {
          resolve(
            files.map(function (fullPath) {
              const isDirectory = (function () {
                try {
                  return fs.lstatSync(fullPath).isDirectory();
                } catch (_err) {
                  return false;
                }
              })();

              return {
                fullPath,
                name: nodePath.basename(fullPath),
                isDirectory
              };
            })
          );
        }
      });
    });
  }

  /**
   * https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/ensureDir.md
   * @param path
   * @returns
   */
  makeDirectory(path: string): Promise<void> {
    if (path.length === 0 || fs.existsSync(path)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      mkdirp(path, function (err) {
        if (err) reject({ result: 'failure', err: err });
        else resolve();
      });
    });
  }

  removeDirRecursive(path: string): void {
    fse.removeSync(path);
  }

  openDialog(args: OpenDialogOptions): Promise<string> {
    throw new Error('Not Supported');
  }

  unzipUrl(url: string, to: string): Promise<void> {
    const _this = this;

    function unzipToFolder(path: string, blob: any, callback: (_: { result: 'success' | 'failure' }) => void) {
      JSZip.loadAsync(blob)
        .then(function (zip) {
          let numFiles = Object.keys(zip.files).length;
          let err = false;
          function fileCompleted(_success?: boolean) {
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

            let dest, buffer;

            zip
              .file(filename)
              .async('nodebuffer')
              .then((_buffer) => {
                dest = nodePath.join(path, filename);
                buffer = _buffer;
                return _this.makeDirectory(nodePath.dirname(dest));
              })
              .then(() => {
                fs.writeFileSync(dest, buffer);
                fileCompleted();
              })
              .catch((e) => {
                err = e;
                fileCompleted(false);
              });
          });
        })
        .catch(function (e) {
          callback({ result: 'failure' });
        });
    }

    return new Promise((resolve, reject) => {
      // Make sure the folder is empty
      const isEmpty = this.isDirectoryEmpty(to);
      if (!isEmpty) {
        reject({ result: 'failure', message: 'Folder must be empty' });
        return;
      }

      // Load zip file from URL
      // @ts-ignore XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      xhr.onload = function (_e) {
        unzipToFolder(to, this.response, function (r) {
          if (r.result !== 'success') {
            reject({ result: 'failure', message: 'Failed to extract' });
            _this.removeDirRecursive(to);
            return;
          }

          resolve();
        });
      };
      xhr.send();
    });
  }

  makeUniquePath(path: string): string {
    let _path = path;
    let count = 1;
    while (fs.existsSync(_path)) {
      _path = path + '-' + count;
      count++;
    }
    return _path;
  }
}
