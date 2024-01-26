import Process from 'process';
import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

describe('git local misc', () => {
  //Read project.json from the filesystem using using node, and then read the same file from the HEAD commit using git. They should be equal.
  //This will test the character encoding, and the test project contains a few special characters
  it('reads files with the correct encoding', async () => {
    const testFilePath = Process.cwd() + '/tests/testfs/git-repo-utf8/';

    //create a temp folder with the test project.json file
    const tempDir = app.getPath('temp') + '/noodlunittests-git-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectorySync(tempDir);
    FileSystem.instance.copyRecursiveSync(testFilePath, tempDir);

    //create a new git repo and commit the file
    const git = new Git(mergeProject);
    await git.initNewRepo(tempDir);
    await git.commit('test');

    //read project.json from the filesystem
    const projectFromFS = JSON.parse(FileSystem.instance.readFileSync(tempDir + 'project.json'));

    //and read the same file from the HEAD commit
    const headCommitId = await git.getHeadCommitId();
    const headCommit = await git.getCommitFromId(headCommitId);
    expect(headCommit).toBeTruthy();
    const projectJson = await headCommit.getFileAsString('project.json');
    const project = JSON.parse(projectJson);
    expect(project).toBeTruthy();

    //and compare
    expect(projectFromFS).toEqual(project);

    //clean up
    await new Promise((resolve) => {
      FileSystem.instance.removeDirectoryRecursive(tempDir, resolve);
    });
  });
});
