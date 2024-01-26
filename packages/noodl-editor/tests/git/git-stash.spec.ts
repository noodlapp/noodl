import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

describe('Git stash tests', function () {
  let git: Git;
  let tempDir: string | undefined;

  beforeEach(async function () {
    // Logger.log(`[jest-before]: ${expect.getState().currentTestName}`)

    tempDir = app.getPath('temp') + '/noodlunittests-git-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectorySync(tempDir);

    git = new Git(mergeProject);
    await git.initNewRepo(tempDir);
  });

  afterEach(function (done) {
    // Logger.log(`\r\n[jest-after]: ${expect.getState().currentTestName}`)
    FileSystem.instance.removeDirectoryRecursive(tempDir, done);
    tempDir = undefined;
  });

  it('stash changes', async function () {
    // cant stash when there are no commits
    FileSystem.instance.writeFileSync(tempDir + 'file.txt', 'text');
    await git.commit('initial commit');

    FileSystem.instance.writeFileSync(tempDir + 'file1.txt', 'text');
    expect(await git.stashPushChanges()).toBeTruthy();

    const status1 = await git.status();
    expect(status1).toEqual([]);

    FileSystem.instance.writeFileSync(tempDir + 'file2.txt', 'text');
    expect(await git.stashPopChanges()).toBe(true);

    // NOTE: Got some issue on OSX where pop was called using spawn process.
    //       OSX didn't seem to like this and ignored the call, changed it to exec.

    // Calling pop here again makes sure that the previous pop worked.
    expect(await git.stashPopChanges()).toBe(false);

    const status2 = await git.status();
    expect(status2.length).toEqual(2);
  });
});
