import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

// https://codehandbook.org/check-if-an-array-sorted-javascript/
// Check if an array is sorted in order.
function sorted(arr: number[]) {
  let second_index: number;
  for (let first_index = 0; first_index < arr.length; first_index++) {
    second_index = first_index + 1;
    if (arr[second_index] - arr[first_index] < 0) return false;
  }
  return true;
}

describe('Git clone progress tests', function () {
  let tempDir: string | undefined;

  beforeEach(async function () {
    tempDir = app.getPath('temp') + '/noodlunittests-git-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectorySync(tempDir);
  });

  afterEach(function (done) {
    FileSystem.instance.removeDirectoryRecursive(tempDir, done);
    tempDir = undefined;
  });

  it('clone from "master" with progress', async function () {
    const result = [];

    // Clone the project
    const git = new Git(mergeProject);
    await git.clone({
      url: 'https://github.com/github/testrepo.git',
      directory: tempDir,
      onProgress: (progress) => {
        result.push(progress);
      }
    });

    const values = result.map((x) => x.value);
    const isValuesSorted = sorted(values);

    expect(result.length).toBeGreaterThan(10);
    expect(isValuesSorted).toBeTrue();
  });

  it('clone and fetch with progress', async function () {
    const result = [];

    // Create empty repo
    const git = new Git(mergeProject);
    await git.clone({
      url: 'https://github.com/github/testrepo.git',
      directory: tempDir,
      onProgress: (progress) => {
        result.push(progress);
      }
    });

    await git.checkoutBranch('master', '6ff1be9c3819c93a2f41e0ddc09f252fcf154f34');

    // Fetch from remote
    await git.fetch({
      onProgress: (progress) => {
        result.push(progress);
      }
    });

    const values = result.map((x) => x.value);
    const isValuesSorted = sorted(values);

    expect(result.length).toBeGreaterThan(10);
    expect(isValuesSorted).toBeTrue();
  });
});
