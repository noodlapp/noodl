import { describe, expect } from '@jest/globals';

import { FileSystemNode } from '../src/filesystem-node';
import { PlatformNode } from '../src/platform-node';

describe('File System', function () {
  // TODO: Skipped because the folder contained package.json, which was picked up by lerna.
  xit('can sync dirs', async function () {
    const platform = new PlatformNode();
    const filesystem = new FileSystemNode();

    const tempDir = filesystem.join(platform.getTempPath(), 'noodlunittests-filesystem-' + Date.now());

    const destPath = filesystem.join(tempDir, 'dst1');
    const sourcePath = filesystem.join(process.cwd(), '/tests/testfs/fs_sync_dir_tests/dst1');

    await filesystem.makeDirectory(tempDir);
    await filesystem.copyFolder(sourcePath, destPath);

    const files = {
      '/dst1/popout-will-be-removed.svg': true,
      '/dst1/should-be-removed/test.js': true,
      '/dst1/project.json': true,
      '/dst1/loginsplash.jpg': false,
      '/dst1/test.js': false,
      '/dst1/test/ajax-loader.gif': false,
      '/dst1/one/delete-me/Roboto-Black.ttf': true,
      '/dst1/one/two/loginsplash2.jpg': false
    };

    Object.keys(files).forEach((file) => {
      const filePath = filesystem.join(tempDir, file);
      const fileExists = filesystem.exists(filePath);

      expect(fileExists).toBe(files[file]);
    });
  });

  // TODO: Skipped because the folder contained package.json, which was picked up by lerna.
  xit('can remove dirs without a slash ending', async function () {
    const platform = new PlatformNode();
    const filesystem = new FileSystemNode();

    const tempDir = filesystem.join(platform.getTempPath(), 'noodlunittests-filesystem-' + Date.now());
    const sourcePath = filesystem.join(process.cwd(), '/tests/testfs/fs_sync_dir_tests/dst1');

    await filesystem.makeDirectory(tempDir);
    await filesystem.copyFolder(sourcePath, tempDir);

    filesystem.removeDirRecursive(tempDir);

    expect(filesystem.exists(tempDir)).toBe(false);
  });

  // TODO: Skipped because the folder contained package.json, which was picked up by lerna.
  xit('can remove dirs with a slash ending', async function () {
    const platform = new PlatformNode();
    const filesystem = new FileSystemNode();

    const tempDir = filesystem.join(platform.getTempPath(), 'noodlunittests-filesystem-' + Date.now()) + '/';
    const sourcePath = filesystem.join(process.cwd(), '/tests/testfs/fs_sync_dir_tests/dst1');

    await filesystem.makeDirectory(tempDir);
    await filesystem.copyFolder(sourcePath, tempDir);

    filesystem.removeDirRecursive(tempDir);

    expect(filesystem.exists(tempDir)).toBe(false);
  });

  // it("can copy dirs and ignore specific files", async function () {
  //   const platform = new PlatformNode();
  //   const filesystem = new FileSystemNode();
  //
  //   const tempDir = filesystem.join(
  //     platform.getTempPath(),
  //     "noodlunittests-filesystem-" + Date.now()
  //   );
  //   const sourcePath = filesystem.join(
  //     process.cwd(),
  //     "/tests/testfs/fs_sync_dir_tests/dst1"
  //   );
  //
  //   await filesystem.makeDirectory(tempDir);
  //   await filesystem.copyFolder(sourcePath, tempDir, {
  //     filter(src) {
  //       return !src.includes(path.sep + "test" + path.sep);
  //     },
  //   });
  //
  //   expect(
  //     filesystem.exists(filesystem.resolve(tempDir, "test/ajax-loader.gif"))
  //   ).toBe(false);
  //   expect(
  //     filesystem.exists(filesystem.resolve(tempDir, "loginsplash.jpg"))
  //   ).toBe(true);
  //   expect(filesystem.exists(filesystem.resolve(tempDir, "project.json"))).toBe(
  //     true
  //   );
  //   expect(filesystem.exists(filesystem.resolve(tempDir, "test.js"))).toBe(
  //     true
  //   );
  // });
});
