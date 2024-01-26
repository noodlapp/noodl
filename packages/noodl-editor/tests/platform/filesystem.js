var FileSystem = require('@noodl-utils/filesystem'),
  Utils = require('@noodl-utils/utils'),
  Process = require('process'),
  path = require('path');

const remote = require('@electron/remote');
const App = remote.app;

// TODO: Skipped because the folder contained package.json, which was picked up by lerna.
xdescribe('File system', function () {
  /*	it("can handle component rename",function() {
  
          var base = JSON.parse( fs.readFileSync(Process.cwd() + '/tests/testfs/merge-tests/base-merge-project-Tue--19-Jan-2021-11-26-44-GMT.json') );
          var ours = JSON.parse( fs.readFileSync(Process.cwd() + '/tests/testfs/merge-tests/ours-merge-project-Tue--19-Jan-2021-11-26-44-GMT.json') );
          var remote = JSON.parse( fs.readFileSync(Process.cwd() + '/tests/testfs/merge-tests/remote-merge-project-Tue--19-Jan-2021-11-26-44-GMT.json') );
  
          var res = ProjectMerger.mergeProject(base, ours, remote);
  
          expect(res.components[3].name).toBe("/UI Components/UI Elements/Rider Section - List Item");
      })
      return;*/

  it('can sync dirs', function () {
    const tempDir = App.getPath('temp') + '/noodlunittests-filesystem-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectorySync(tempDir);
    FileSystem.instance.copyRecursiveSync(Process.cwd() + '/tests/testfs/fs_sync_dir_tests/dst1', tempDir + '/dst1');

    FileSystem.instance.syncDirsRecursiveSync(
      Process.cwd() + '/tests/testfs/fs_sync_dir_tests/src1',
      tempDir + '/dst1'
    );

    expect(fs.existsSync(tempDir + '/dst1/popout-will-be-removed.svg')).toBe(false);
    expect(fs.existsSync(tempDir + '/dst1/should-be-removed/test.js')).toBe(false);
    expect(fs.existsSync(tempDir + '/dst1/project.json')).toBe(true);
    expect(fs.existsSync(tempDir + '/dst1/loginsplash.jpg')).toBe(true);
    expect(fs.existsSync(tempDir + '/dst1/test.js')).toBe(true);
    expect(fs.existsSync(tempDir + '/dst1/test/ajax-loader.gif')).toBe(true);
    expect(fs.existsSync(tempDir + '/dst1/one/delete-me/Roboto-Black.ttf')).toBe(false);
    expect(fs.existsSync(tempDir + '/dst1/one/two/loginsplash2.jpg')).toBe(true);
  });

  it('can remove dirs without a slash ending', function (done) {
    const tempDir = App.getPath('temp') + '/noodlunittests-filesystem-' + Utils.guid();
    FileSystem.instance.makeDirectorySync(tempDir);

    FileSystem.instance.copyRecursiveSync(Process.cwd() + '/tests/testfs/fs_sync_dir_tests/dst1', tempDir);

    FileSystem.instance.removeDirectoryRecursive(tempDir, () => {
      expect(fs.existsSync(tempDir)).toBe(false);
      done();
    });
  });

  it('can remove dirs with a slash ending', function (done) {
    const tempDir = App.getPath('temp') + '/noodlunittests-filesystem-' + Utils.guid() + '/';

    FileSystem.instance.makeDirectorySync(tempDir);
    FileSystem.instance.copyRecursiveSync(Process.cwd() + '/tests/testfs/fs_sync_dir_tests/dst1', tempDir);
    FileSystem.instance.removeDirectoryRecursive(tempDir, () => {
      expect(fs.existsSync(tempDir)).toBe(false);
      done();
    });
  });

  it('can copy dirs and ignore specific files', function () {
    const tempDir = App.getPath('temp') + '/noodlunittests-filesystem-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectorySync(tempDir);
    FileSystem.instance.copyRecursiveSync(Process.cwd() + '/tests/testfs/fs_sync_dir_tests/src1', tempDir, {
      filter(src) {
        return !src.includes(path.sep + 'test' + path.sep);
      }
    });

    expect(fs.existsSync(tempDir + 'test/ajax-loader.gif')).toBe(false);
    expect(fs.existsSync(tempDir + 'loginsplash.jpg')).toBe(true);
    expect(fs.existsSync(tempDir + 'project.json')).toBe(true);
    expect(fs.existsSync(tempDir + 'test.js')).toBe(true);
  });
});
