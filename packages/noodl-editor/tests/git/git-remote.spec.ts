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

describe('Git remote tests', function () {
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

  it('can get remote head', async function () {
    FileSystem.instance.writeFileSync(path.join(localDirA, 'a.txt'), 'Hello World');
    await localGitA.commit('local commit');

    const remoteHeadId1 = await localGitA.getRemoteHeadCommitId();
    const localHeadId1 = await localGitA.getHeadCommitId();
    expect(remoteHeadId1).not.toEqual(localHeadId1);

    await localGitA.push();

    const remoteHeadId2 = await localGitA.getRemoteHeadCommitId();
    const localHeadId2 = await localGitA.getHeadCommitId();
    expect(remoteHeadId2).toEqual(localHeadId2);
  });

  it('can push and fetch remote commits', async function () {
    FileSystem.instance.writeFileSync(path.join(localDirA, 'a.txt'), 'Hello World');
    await localGitA.commit('localA commit');
    await localGitA.push();

    await localGitB.fetch({});

    const commits = await localGitB.getCommitsCurrentBranch();

    expect(commits[0].isLocalAhead).toBe(false);
    expect(commits[0].isRemoteAhead).toBe(true);
    expect(commits[0].message).toEqual('localA commit');

    expect(commits[0].isLocalAhead).toBe(false);
    expect(commits[1].isRemoteAhead).toBe(false);
    expect(commits[1].message).toEqual('initial commit');

    expect(commits.length).toEqual(2);
  });

  it('can list local and remote branches', async function () {
    await localGitA.createAndCheckoutBranch('A');
    await localGitB.createAndCheckoutBranch('B');

    await localGitA.push();
    await localGitB.fetch({});

    const branches = await localGitB.getBranches();

    //alphabetical order
    expect(branches[0]).toEqual({ name: 'A', remote: true, local: false });
    expect(branches[1]).toEqual({ name: 'B', remote: false, local: true });
    expect(branches[2]).toEqual({ name: 'main', remote: true, local: true });

    expect(branches.length).toBe(3);
  });

  it('can checkout remote branch', async function () {
    await localGitA.createAndCheckoutBranch('A');

    FileSystem.instance.writeFileSync(path.join(localDirA, 'test.txt'), 'remote file');
    await localGitA.commit('A commit');
    await localGitA.push();

    await localGitB.fetch({});
    await localGitB.checkoutRemoteBranch('A');

    expect(await readTextFile(path.join(localDirB, 'test.txt'))).toBe('remote file');

    const commits = await localGitB.getCommitsCurrentBranch();

    expect(commits[0].message).toEqual('A commit');
    expect(commits.length).toEqual(2);
  });

  it('can list remote branch correctly when they have slashes in the name', async function () {
    await localGitA.createAndCheckoutBranch('test/A');

    FileSystem.instance.writeFileSync(path.join(localDirA, 'test.txt'), 'remote file');
    await localGitA.commit('A commit');
    await localGitA.push();

    await localGitB.fetch({});
    const branches = await localGitB.getBranches();

    expect(branches[1]).toEqual({ name: 'test/A', remote: true, local: false });
  });

  it('can delete remote branch', async function () {
    //A creates a new branch
    await localGitA.createAndCheckoutBranch('A');
    await localGitA.push();

    //B fetches the new branch
    await localGitB.fetch({});
    let branches = await localGitB.getBranches();
    expect(branches.length).toEqual(2);

    //B deletes the branch
    await localGitB.deleteRemoteBranch('A');

    //.. and B now doesn't have it anymore
    branches = await localGitB.getBranches();
    expect(branches.length).toEqual(1);

    //A should think it still exists on the remote
    branches = await localGitA.getBranches();
    expect(branches.find((b) => b.name === 'A').remote).toEqual(true);

    //but after a fetch it should be local only
    await localGitA.fetch({});
    branches = await localGitA.getBranches();
    const branchA = branches.find((b) => b.name === 'A');
    expect(branchA.remote).toEqual(false);
    expect(branchA.local).toEqual(true);
  });

  it('can delete local branch but leave remote intact', async function () {
    await localGitA.createAndCheckoutBranch('A');
    await localGitA.push();

    await localGitB.fetch({});
    await localGitB.checkoutRemoteBranch('A');

    let branches = await localGitB.getBranches();
    expect(branches.length).toEqual(2);
    expect(branches[0]).toEqual({ name: 'A', local: true, remote: true });

    await localGitB.checkoutBranch('main');
    await localGitB.deleteBranch('A');

    branches = await localGitB.getBranches();
    expect(branches.length).toEqual(2);

    expect(branches[0]).toEqual({ name: 'A', local: false, remote: true });
  });

  it('correctly identifies local vs remote commits - one ahead', async function () {
    await localGitA.createAndCheckoutBranch('A');

    FileSystem.instance.writeFileSync(path.join(localDirA, 'a.txt'), 'Hello World');
    await localGitA.commit('A commit');
    expect(await localGitA.push()).toBe(true);

    FileSystem.instance.writeFileSync(path.join(localDirA, 'a1.txt'), 'Hello World');
    await localGitA.commit('A1 commit');

    const commits = await localGitA.getCommitsCurrentBranch();
    expect(commits.length).toBe(3);
    expect(commits[0].isLocalAhead).toBe(true);
    expect(commits[1].isLocalAhead).toBeFalsy();
  });

  it('correctly identifies local vs remote commits - branch not pushed', async function () {
    await localGitA.createAndCheckoutBranch('A');

    FileSystem.instance.writeFileSync(path.join(localDirA, 'a.txt'), 'Hello World');
    await localGitA.commit('A commit');

    FileSystem.instance.writeFileSync(path.join(localDirA, 'a1.txt'), 'Hello World');
    await localGitA.commit('A1 commit');

    const commits = await localGitA.getCommitsCurrentBranch();
    expect(commits.length).toBe(3);
    expect(commits[0].isLocalAhead).toBe(true);
    expect(commits[1].isLocalAhead).toBe(true);
  });

  it('Push when there are remote changes', async function () {
    FileSystem.instance.writeFileSync(path.join(localDirA, 'a.txt'), 'Hello World');
    await localGitA.commit('A commit');
    await localGitA.push({});

    FileSystem.instance.writeFileSync(path.join(localDirB, 'a.txt'), 'Hello World2');
    await localGitB.commit('A commit');

    try {
      await localGitB.push({});
      expect(true).toBe(false);
    } catch (error) {
      expect(error.toString()).toContain(
        'Updates were rejected because there are new changes that you do not have locally.'
      );
    }
  });

  it('getCommitsBetween returns the correct commits (squash)', async function () {
    FileSystem.instance.writeFileSync(path.join(localDirA, 'a.txt'), 'Hello World');
    await localGitA.commit('A commit');
    await localGitA.push();

    await localGitB.pull({});
    await localGitB.createAndCheckoutBranch('A');

    FileSystem.instance.writeFileSync(path.join(localDirB, 'b.txt'), 'Hello World');
    await localGitB.commit('B commit');
    await localGitB.push();

    const headCommitId = await localGitA.getHeadCommitId();
    const branchCommitId = await localGitB.getHeadCommitId();

    const allCommits = await localGitA.getCommitsCurrentBranch();
    expect(allCommits.length).toBe(2);
    expect(allCommits[0].message).toBe('A commit');
    expect(allCommits[1].message).toBe('initial commit');

    const commits = await localGitB.getCommitsBetween(branchCommitId, headCommitId);
    expect(commits.length).toBe(1);
    expect(commits[0].message).toBe('B commit');

    await localGitA.fetch({});
    await localGitA.mergeToCurrentBranch('origin/A');

    const allCommits2 = await localGitA.getCommitsCurrentBranch();
    expect(allCommits2.length).toBe(3);
    expect(allCommits2[0].message).toBe("Squashed commit from branch 'origin/A'");
    expect(allCommits2[1].message).toBe('A commit');
    expect(allCommits2[2].message).toBe('initial commit');
  });

  it('getCommitsBetween returns the correct commits', async function () {
    FileSystem.instance.writeFileSync(path.join(localDirA, 'a.txt'), 'Hello World');
    await localGitA.commit('A commit');
    await localGitA.push();

    await localGitB.pull({});
    await localGitB.createAndCheckoutBranch('A');

    FileSystem.instance.writeFileSync(path.join(localDirB, 'b.txt'), 'Hello World');
    await localGitB.commit('B commit');
    await localGitB.push();

    const headCommitId = await localGitA.getHeadCommitId();
    const branchCommitId = await localGitB.getHeadCommitId();

    const allCommits = await localGitA.getCommitsCurrentBranch();
    expect(allCommits.length).toBe(2);
    expect(allCommits[0].message).toBe('A commit');
    expect(allCommits[1].message).toBe('initial commit');

    const commits = await localGitB.getCommitsBetween(branchCommitId, headCommitId);
    expect(commits.length).toBe(1);
    expect(commits[0].message).toBe('B commit');

    await localGitA.fetch({});
    await localGitA.mergeToCurrentBranch('origin/A', false);

    const allCommits2 = await localGitA.getCommitsCurrentBranch();
    expect(allCommits2.length).toBe(3);
    expect(allCommits2[0].message).toBe('B commit');
    expect(allCommits2[1].message).toBe('A commit');
    expect(allCommits2[2].message).toBe('initial commit');
  });
});
