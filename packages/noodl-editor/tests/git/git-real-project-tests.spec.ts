import fs from 'fs';
import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

async function unzipFileToFolder(zipPath: string, tempDir: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fs.readFile(zipPath, (err, data) => {
      if (err) throw err;

      FileSystem.instance.unzipToFolder(tempDir, data, (r) => {
        if (r.result === 'success') {
          resolve();
        } else {
          reject(r);
        }
      });
    });
  });
}

describe('Git tests - misc', () => {
  let tempDir: string;
  let remoteDir: string;

  beforeEach(async function () {
    tempDir = app.getPath('temp') + '/noodlunittests-git-' + Utils.guid() + '/';
    remoteDir = app.getPath('temp') + '/noodlunittests-git-' + Utils.guid() + '/';

    FileSystem.instance.makeDirectorySync(tempDir);
    FileSystem.instance.makeDirectorySync(remoteDir);
  });

  afterEach(function (done) {
    FileSystem.instance.removeDirectoryRecursive(tempDir, () => {
      FileSystem.instance.removeDirectoryRecursive(remoteDir, done);
    });
  });

  it('can merge text example with two branches', async function () {
    const zipPath = process.cwd() + '/tests/testfs/git-merge-test-1.zip';

    //unzip test project
    await unzipFileToFolder(zipPath, tempDir);

    const remoteGit = new Git(mergeProject);
    await remoteGit.initNewRepo(remoteDir, { bare: true });

    const git = new Git(mergeProject);
    await git.openRepository(tempDir + 'git-merge-test-1');

    await git.addRemote(remoteDir);
    await git.push();

    await git.checkoutBranch('branch-test');
    await git.push();

    const branchCommitId = await git.getHeadCommitOnBranch('main');

    const c = await git.getCommitFromId(branchCommitId);
    expect(c).toBeTruthy();
  });
});
