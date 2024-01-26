import path from 'path';
import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

describe('Git log tests', function () {
  let git: Git;
  let tempDir: string | undefined;

  beforeEach(async function () {
    // Logger.log(`[jest-before]: ${expect.getState().currentTestName}`);

    tempDir = app.getPath('temp') + '/noodlunittests-git-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectorySync(tempDir);

    git = new Git(mergeProject);
    await git.initNewRepo(tempDir);
  });

  afterEach(function (done) {
    // Logger.log(`\r\n[jest-after]: ${expect.getState().currentTestName}`);

    FileSystem.instance.removeDirectoryRecursive(tempDir, done);
    tempDir = undefined;
  });

  it('make a few commits and check logs', async function () {
    FileSystem.instance.writeFileSync(tempDir + 'file1.txt', 'text');
    await git.setConfigValue('user.name', 'test');
    await git.setConfigValue('user.email', 'test@test.test');

    await git.commit('add file1.txt');
    const commit0 = await git.getHeadCommitId();

    FileSystem.instance.writeFileSync(tempDir + 'file2.txt', 'text');
    await git.commit('add file2.txt');

    FileSystem.instance.writeFileSync(tempDir + 'file3.txt', 'text');
    await git.commit('add file3.txt');
    const commit2 = await git.getHeadCommitId();

    const commits = await git.getCommitsBetween(commit0, commit2);
    expect(commits.length).toBe(2);
    expect(commits[0].message).toEqual('add file3.txt');
    expect(commits[0].author.name).toEqual('test');
    expect(commits[0].author.email).toEqual('test@test.test');
    expect(commits[1].message).toEqual('add file2.txt');
  });

  it('can get the commits included in a merge', async function () {
    FileSystem.instance.writeFileSync(tempDir + 'file1.txt', 'text');
    await git.commit('add file1.txt');

    //create a new brach and do a checkout
    await git.createAndCheckoutBranch('test-branch');

    FileSystem.instance.writeFileSync(tempDir + 'file2.txt', 'text');
    await git.commit('a commit');
    const commit1Sha = await git.getHeadCommitId();
    expect(commit1Sha).toBeTruthy();

    FileSystem.instance.writeFileSync(tempDir + 'file3.txt', 'text');
    await git.commit('another commit');
    const commit2Sha = await git.getHeadCommitId();
    expect(commit1Sha).toBeTruthy();

    await git.checkoutBranch('main');

    const mainHead = await git.getHeadCommitId();
    const testBranchHead = await git.getHeadCommitOnBranch('test-branch');

    expect(mainHead).toBeTruthy();
    expect(testBranchHead).toBeTruthy();

    // TODO: The order matters a lot, this will fail in the real test
    const commits = await git.getCommitsBetween(mainHead, testBranchHead);

    expect(commits.length).toEqual(2);
    expect(commits[0].message).toEqual('another commit');
    expect(commits[1].message).toEqual('a commit');
  });

  it('support .gitignore', async function () {
    FileSystem.instance.writeFileSync(path.join(tempDir, 'test.txt'), 'hello');
    FileSystem.instance.writeFileSync(path.join(tempDir, '.DS_Store'), 'asdasd');

    const status1 = await git.status();
    expect(status1.length).toBe(3);
    expect(status1).toEqual([
      { status: 'new', path: '.gitattributes' },
      { status: 'new', path: '.gitignore' },
      { status: 'new', path: 'test.txt' }
    ]);

    await git.commit('A added file');

    FileSystem.instance.writeFileSync(path.join(tempDir, '.DS_Store'), 'asd');

    const status2 = await git.status();
    expect(status2.length).toBe(0);
  });
});
