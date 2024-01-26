import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

describe('Git diff tests', function () {
  let git: Git;
  let tempDir: string;

  beforeEach(async function () {
    // Logger.log(`[jest-before]: ${expect.getState().currentTestName}`)

    tempDir = app.getPath('temp') + '/noodlunittests-git-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectorySync(tempDir);

    git = new Git(mergeProject);
    await git.initNewRepo(tempDir);
    // await git.commit("initial commit"); //commit .gitattributes so we have a clean repo
  });

  afterEach(function (done) {
    // Logger.log(`\r\n[jest-after]: ${expect.getState().currentTestName}`)
    FileSystem.instance.removeDirectoryRecursive(tempDir, done);
    tempDir = undefined;
  });

  it('can diff files between commits', async function () {
    FileSystem.instance.writeFileSync(tempDir + 'initial.txt', 'hello world');
    await git.commit('initial commit');

    const commit0 = await git.getHeadCommitId();

    FileSystem.instance.writeFileSync(tempDir + 'file.txt', 'text');
    await git.commit('added file');

    const commit1 = await git.getHeadCommitId();
    let diff = await git.getFileDiff(commit0, commit1);
    expect(diff).toEqual([
      {
        status: 'new',
        path: 'file.txt'
      }
    ]);

    FileSystem.instance.writeFileSync(tempDir + 'file.txt', 'text2');
    await git.commit('modified file');

    const commit2 = await git.getHeadCommitId();
    diff = await git.getFileDiff(commit1, commit2);
    expect(diff).toEqual([
      {
        status: 'modified',
        path: 'file.txt'
      }
    ]);
  });
});
