import path from 'path';
import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

// jest.setTimeout(10_000);

async function readTextFile(path) {
  return new Promise((resolve, reject) => {
    FileSystem.instance.readTextFile(path, (text) => {
      resolve(text);
    });
  });
}

describe('Git remote squash tests', function () {
  let localGitA: Git, localGitB: Git;
  let remoteGit: Git;

  let localDirA: string;
  let localDirB: string;
  let remoteDir: string;

  beforeEach(async function () {
    // console.log(`[jest-before]: ${jasmine.currentTest.fullName}`);

    remoteDir = path.join(app.getPath('temp'), '/noodlunittests-git-' + Utils.guid());
    localDirA = path.join(app.getPath('temp'), '/noodlunittests-git-' + Utils.guid());
    localDirB = path.join(app.getPath('temp'), '/noodlunittests-git-' + Utils.guid());

    // Logger.log("remoteDir: " + remoteDir);
    // Logger.log("localDirA: " + localDirA);
    // Logger.log("localDirB: " + localDirB);

    FileSystem.instance.makeDirectorySync(localDirA);
    FileSystem.instance.makeDirectorySync(localDirB);
    FileSystem.instance.makeDirectorySync(remoteDir);

    localGitA = new Git(mergeProject);
    localGitB = new Git(mergeProject);
    remoteGit = new Git(mergeProject);

    //init a bare repository as remote
    await remoteGit.initNewRepo(remoteDir, { bare: true });

    //init a new local repo and push it to A (mimics how a new project is created)
    await localGitA.initNewRepo(localDirA);

    // The new version doesnt make a first commit
    FileSystem.instance.writeFileSync(localDirA + 'initial.txt', 'Hello World');
    await localGitA.commit('initial commit');

    await localGitA.addRemote(remoteDir);
    await localGitA.push();

    //and clone the project as B to another directory
    await localGitB.clone({
      url: remoteDir,
      directory: localDirB,
      onProgress: undefined
    });
  });

  afterEach(function (done) {
    // Logger.log(`\r\n[jest-after]: ${expect.getState().currentTestName}`);

    FileSystem.instance.removeDirectoryRecursive(remoteDir, () => {
      FileSystem.instance.removeDirectoryRecursive(localDirA, () => {
        FileSystem.instance.removeDirectoryRecursive(localDirB, done);
      });
    });
  });

  it('Push when there are remote changes (squash merge)', async function () {
    await localGitB.createAndCheckoutBranch('squash-test');

    FileSystem.instance.writeFileSync(path.join(localDirB, 'a.txt'), 'Hello World');
    await localGitB.commit('commit 1');

    FileSystem.instance.writeFileSync(path.join(localDirB, 'b.txt'), 'Hello World');
    await localGitB.commit('commit 2');

    FileSystem.instance.writeFileSync(path.join(localDirB, 'c.txt'), 'Hello World');
    await localGitB.commit('commit 3');

    await localGitB.push();

    await localGitA.pull({});
    await localGitA.mergeToCurrentBranch('origin/squash-test');

    const commits = await localGitA.getCommitsCurrentBranch();
    expect(commits[0].message).toBe("Squashed commit from branch 'origin/squash-test'");
    expect(commits[1].message).toBe('initial commit');
  });

  it('Push when there are remote changes (merge)', async function () {
    await localGitB.createAndCheckoutBranch('squash-test');

    FileSystem.instance.writeFileSync(path.join(localDirB, 'a.txt'), 'Hello World');
    await localGitB.commit('commit 1');

    FileSystem.instance.writeFileSync(path.join(localDirB, 'b.txt'), 'Hello World');
    await localGitB.commit('commit 2');

    FileSystem.instance.writeFileSync(path.join(localDirB, 'c.txt'), 'Hello World');
    await localGitB.commit('commit 3');

    await localGitB.push();

    await localGitA.pull({});
    await localGitA.mergeToCurrentBranch('origin/squash-test', false);

    const commits = await localGitA.getCommitsCurrentBranch();
    expect(commits[0].message).toBe('commit 3');
    expect(commits[1].message).toBe('commit 2');
    expect(commits[2].message).toBe('commit 1');
    expect(commits[3].message).toBe('initial commit');
  });
});
