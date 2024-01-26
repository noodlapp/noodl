import fs from 'fs';
import path from 'path';
import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

describe('Git stash tests', function () {
  let localGitA: Git, localGitB: Git;
  let remoteGit: Git;

  let localDirA: string;
  let localDirB: string;
  let remoteDir: string;

  beforeEach(async function () {
    // Logger.log(`[jest-before]: ${expect.getState().currentTestName}`)

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
  });

  afterEach(function (done) {
    // Logger.log(`\r\n[jest-after]: ${expect.getState().currentTestName}`)

    FileSystem.instance.removeDirectoryRecursive(remoteDir, () => {
      FileSystem.instance.removeDirectoryRecursive(localDirA, () => {
        FileSystem.instance.removeDirectoryRecursive(localDirB, done);
      });
    });
  });

  /**
   * Issue: https://app.asana.com/0/1202061493156140/1202351418844106/f
   * >
   * > Michael Cartner:
   * > i mitt fall så var det två användare som öppnade samma 2.5 projekt.
   * > Båda skapade då en .gitignore lokalt
   * > Användare A commitade
   * > Användare B pullade => felmeddelandet ovan
   * >
   * >
   * > Related?: https://stackoverflow.com/questions/51275777/why-does-git-stash-pop-say-that-it-could-not-restore-untracked-files-from-stash
   */
  it('pop-stash with merge issues', async function () {
    // Git A
    // 1. delete .gitignore
    const statusA1 = await localGitA.status();
    expect(statusA1.length).toEqual(2); // .gitignore and .gitattributes

    fs.writeFileSync(localDirA + '/temp', 'temp');
    fs.unlinkSync(localDirA + '/.gitignore');

    await localGitA.commit('initial commit without .gitignore');
    await localGitA.addRemote(remoteDir);
    await localGitA.push();

    // Git B
    await localGitB.clone({ url: remoteDir, directory: localDirB });
    await localGitB.fetch({});

    const statusB1 = await localGitB.status();
    expect(statusB1.length).toEqual(1);

    await localGitB.commit('commit .gitignore');
    await localGitB.push();

    // Git A
    // Recreate the repo (creating .gitignore)
    localGitA = new Git(mergeProject);
    await localGitA.openRepository(localDirA);

    // Check that we have it
    const statusA2 = await localGitA.status();
    expect(statusA2.length).toEqual(1);

    /**
     * GitError: .gitignore already exists, no checkout
     * error: could not restore untracked files from stash
     */
    await localGitA.pull({});

    const statusA3 = await localGitA.status();
    expect(statusA3.length).toEqual(0);
  });
});
