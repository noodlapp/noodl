import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

// TODO: Stash untracked files ?

async function readTextFile(path) {
  return new Promise<string>((resolve, reject) => {
    FileSystem.instance.readTextFile(path, (text) => {
      resolve(text);
    });
  });
}

describe('Git local tests', function () {
  let git: Git;
  let tempDir: string | undefined;

  beforeEach(async function () {
    // Logger.log(`[jest-before]: ${expect.getState().currentTestName}`);

    tempDir = app.getPath('temp') + '/noodlunittests-git-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectorySync(tempDir);

    git = new Git(mergeProject);
    await git.initNewRepo(tempDir);

    // The new version doesnt make a first commit
    FileSystem.instance.writeFileSync(tempDir + 'initial.txt', 'Hello World');
    await git.commit('initial commit');
  });

  afterEach(function (done) {
    // Logger.log(`\r\n[jest-after]: ${expect.getState().currentTestName}`);

    FileSystem.instance.removeDirectoryRecursive(tempDir, done);
    tempDir = undefined;
  });

  it('can handle merge conflicts in files', async function () {
    //commit new file on main
    const path = tempDir + 'test.txt';

    FileSystem.instance.writeFileSync(path, 'original');
    await git.commit('added new file');

    //create new brach, change the file, and commit it
    await git.createAndCheckoutBranch('test-branch');
    FileSystem.instance.writeFileSync(path, 'test-branch');
    await git.commit('modified file');

    //move back to main, and change the file
    await git.checkoutBranch('main');
    FileSystem.instance.writeFileSync(path, 'main');

    //and now merge in the test brach. Should automatically resolve the conflict to "ours"
    await git.mergeToCurrentBranch('test-branch');
    const file = await readTextFile(path);
    expect(file).toBe('main');

    // Status should show test.txt as modified
    const status = await git.status();
    expect(status).toEqual([{ status: 'modified', path: 'test.txt' }]);
  });

  it('can handle merge without conflicts in project.json', async function () {
    //commit project on main
    const path = tempDir + 'project.json';

    FileSystem.instance.writeFileSync(path, JSON.stringify(simpleProject()));
    await git.commit('added original project');

    //create new brach, change the project, and commit it
    await git.createAndCheckoutBranch('test-branch');
    await git.checkoutBranch('test-branch');

    const modifiedProjectTestBranch = simpleProject();
    modifiedProjectTestBranch.components[0].graph.roots[0].parameters.text = 'test-branch';
    FileSystem.instance.writeFileSync(path, JSON.stringify(modifiedProjectTestBranch));
    await git.commit('modified project');

    //move back to main, and merge in the test branch
    await git.checkoutBranch('main');
    await git.mergeToCurrentBranch('test-branch');
    const proj = JSON.parse(await readTextFile(path));

    const conflicts = proj.components[0].graph.roots[0].conflicts;
    expect(conflicts).toBe(undefined);
    expect(proj.components[0].graph.roots[0].parameters.text).toBe('test-branch');

    //status should be empty
    expect(await git.status()).toEqual([]);
  });

  it('can handle merge with conflicts in project.json', async function () {
    //commit project on main
    const path = tempDir + 'project.json';

    FileSystem.instance.writeFileSync(path, JSON.stringify(simpleProject()));
    await git.commit('added original project');

    //create new brach, change the project, and commit it
    await git.createAndCheckoutBranch('test-branch');
    await git.checkoutBranch('test-branch');

    const modifiedProjectTestBranch = simpleProject();
    modifiedProjectTestBranch.components[0].graph.roots[0].parameters.text = 'test-branch';
    FileSystem.instance.writeFileSync(path, JSON.stringify(modifiedProjectTestBranch));
    await git.commit('modified project');

    //move back to main, and change the project again
    await git.checkoutBranch('main');
    const modifiedProjectMaster = simpleProject();
    modifiedProjectMaster.components[0].graph.roots[0].parameters.text = 'main';

    FileSystem.instance.writeFileSync(path, JSON.stringify(modifiedProjectMaster));

    //and now merge in the test brach. Should automatically result in conflicts in project
    await git.mergeToCurrentBranch('test-branch');
    const proj = JSON.parse(await readTextFile(path));

    const conflicts = proj.components[0].graph.roots[0].conflicts;
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].name).toBe('text');
    expect(conflicts[0].ours).toBe('main');
    expect(conflicts[0].theirs).toBe('test-branch');

    //check that status is contains a modified project.json
    expect(await git.status()).toEqual([{ status: 'modified', path: 'project.json' }]);
  });

  function simpleProject() {
    return {
      name: 'proj',
      components: [
        {
          name: '/comp1',
          graph: {
            roots: [
              {
                id: 'c8451024-fe91-0cbe-b3ad-85d77dd01432',
                type: 'Text',
                x: 237,
                y: 170,
                parameters: {
                  text: 'original'
                }
              }
            ]
          }
        }
      ],
      rootNodeId: 'c8451024-fe91-0cbe-b3ad-85d77dd01432',
      version: '1'
    };
  }
});
