import path from 'path';
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

  it('new repo has correct config and no changes', async function () {
    const text = await readTextFile(tempDir + '.git/config');

    expect(text.includes('precomposeUnicode = true')).toBe(true);

    expect(text.includes('[merge "noodl"]')).toBe(true);

    expect(await git.status()).toEqual([]);
  });

  it('can get head commit', async function () {
    const head = await git.getHeadCommitId();
    expect(head).toHaveSize(40); // git commit hash length
  });

  it('can get remote commit', async function () {
    //we have no remote, so it should be null
    const head = await git.getRemoteHeadCommitId();
    expect(head).toBe(null);
  });

  it('can commit a new file', async function () {
    //add a new file
    FileSystem.instance.writeFileSync(tempDir + 'test.txt', 'hej');

    //status should reflect the new file
    let status = await git.status();
    expect(status.length).toBe(1);
    expect(status[0].path).toBe('test.txt');
    expect(status[0].status).toBe('new');

    //commit the file
    await git.commit('added new file');

    //now git status should be empty
    status = await git.status();
    expect(status.length).toBe(0);

    //and read it's content to make sure it wasn't modified
    const text = await readTextFile(tempDir + 'test.txt');
    expect(text).toBe('hej');
  });

  it('can reset untracked files', async function () {
    //add a new file
    const path = tempDir + 'test.txt';

    FileSystem.instance.writeFileSync(path, 'hej');
    expect(FileSystem.instance.fileExistsSync(path)).toBe(true);

    await git.resetToHead();

    expect(FileSystem.instance.fileExistsSync(path)).toBe(false);
    const status = await git.status();
    expect(status.length).toBe(0);
  });

  it('can reset changed files', async function () {
    //add a new file
    const path = tempDir + 'test.txt';

    //add file and commit it
    FileSystem.instance.writeFileSync(path, 'hej');
    await git.commit('added new file');

    //change the file content
    FileSystem.instance.writeFileSync(path, 'hej2');
    expect(await readTextFile(path)).toBe('hej2');

    await git.resetToHead();

    expect(await readTextFile(path)).toBe('hej');

    //check that status is empty
    const status = await git.status();
    expect(status.length).toBe(0);
  });

  it('can create and checkout a new branch', async function () {
    expect(await git.getCurrentBranchName()).toBe('main');

    await git.createAndCheckoutBranch('test-branch');
    await git.checkoutBranch('test-branch');
    expect(await git.getCurrentBranchName()).toBe('test-branch');

    //check that status is empty
    const status = await git.status();
    expect(status.length).toBe(0);
  });

  it('can list all branches', async function () {
    expect(await git.getBranches()).toEqual([{ name: 'main', local: true, remote: false }]);

    await git.createAndCheckoutBranch('test-branch-1');
    await git.createAndCheckoutBranch('test-branch-2');

    const branches = await git.getBranches();

    expect(branches[0]).toEqual({ name: 'main', local: true, remote: false });
    expect(branches[1]).toEqual({
      name: 'test-branch-1',
      local: true,
      remote: false
    });
    expect(branches[2]).toEqual({
      name: 'test-branch-2',
      local: true,
      remote: false
    });
  });

  it('can list commits from different branches', async function () {
    const path = tempDir + 'test.txt';

    await git.createAndCheckoutBranch('test-branch-1');
    await git.checkoutBranch('test-branch-1');

    //commit new file on test-branch
    FileSystem.instance.writeFileSync(path, 'text file');
    await git.commit('added new file');

    await git.checkoutBranch('main');
    let commits = await git.getCommitsCurrentBranch();
    expect(commits.length).toBe(1);
    expect(commits[0].message).toBe('initial commit');

    await git.checkoutBranch('test-branch-1');
    commits = await git.getCommitsCurrentBranch();

    //latest first
    expect(commits.length).toBe(2);
    expect(commits[0].message).toBe('added new file');
    expect(commits[1].message).toBe('initial commit');

    //back to main, shouldn't see the commit on the other branch
    await git.checkoutBranch('main');
    commits = await git.getCommitsCurrentBranch();
    expect(commits.length).toBe(1);
    expect(commits[0].message).toBe('initial commit');
  });

  it('can list commits', async function () {
    //do a new commit
    FileSystem.instance.writeFileSync(tempDir + 'test.txt', 'text file');
    await git.commit('added new file');

    const commits = await git.getCommitsCurrentBranch();
    expect(commits.length).toBe(2);

    //latest first
    expect(commits[0].message).toBe('added new file');
    expect(commits[0].parentCount).toBe(1);
    expect(commits[1].message).toBe('initial commit');
    expect(commits[1].parentCount).toBe(0);
  });

  it('throws nice error message when creating invalid branches', async function () {
    await expectAsync(git.createAndCheckoutBranch('main')).toBeRejectedWithError('Branch already exists');
    await expectAsync(git.createAndCheckoutBranch(')(*&^%$')).toBeRejectedWithError(
      'Branch name contains invalid characters.'
    );
  });

  it('can delete a local branch', async function () {
    await git.createBranchFromHead('test');
    await git.deleteBranch('test');

    expect(await git.getBranches()).toEqual([{ name: 'main', local: true, remote: false }]);
  });

  it('fails when deleting a non-existing branch', async function () {
    await expectAsync(git.deleteBranch('test')).toBeRejectedWithError("Branch doesn't exist");
  });

  it('remembers local changes per branch using the stash', async function () {
    const path = tempDir + 'test.txt';

    //commit a file
    FileSystem.instance.writeFileSync(path, 'original');
    await git.commit('added the file');

    //make a local change
    FileSystem.instance.writeFileSync(path, 'main');

    //create a few branches and make changes on each, without committing
    await git.createBranchFromHead('test-1');
    await git.checkoutBranch('test-1');
    FileSystem.instance.writeFileSync(path, 'test-1');

    await git.createBranchFromHead('test-2');
    await git.checkoutBranch('test-2');
    FileSystem.instance.writeFileSync(path, 'test-2');

    //checkout all branches and make sure the local changes are re-applied
    await git.checkoutBranch('main');
    expect(await readTextFile(path)).toBe('main');

    await git.checkoutBranch('test-1');
    expect(await readTextFile(path)).toBe('test-1');

    await git.checkoutBranch('test-2');
    expect(await readTextFile(path)).toBe('test-2');

    //and back again, just to make sure :)
    await git.checkoutBranch('test-1');
    expect(await readTextFile(path)).toBe('test-1');

    await git.checkoutBranch('main');
    expect(await readTextFile(path)).toBe('main');
  });

  it('brings the local changes to a newly created branch', async function () {
    const path = tempDir + 'test.txt';

    //commit a file
    FileSystem.instance.writeFileSync(path, 'original');
    await git.commit('added the file');

    //make a local change
    FileSystem.instance.writeFileSync(path, 'change');

    //create a new branch, it should get the changes
    await git.createAndCheckoutBranch('test-1');
    expect(await readTextFile(path)).toBe('change');

    //and move it over to yet another new branch
    await git.createAndCheckoutBranch('test-2');
    expect(await readTextFile(path)).toBe('change');

    //checkout all other branches and make sure they don't have any changes
    await git.checkoutBranch('main');
    FileSystem.instance.writeFileSync(path, 'original');

    await git.checkoutBranch('test-1');
    FileSystem.instance.writeFileSync(path, 'original');

    //and that test-2 still have them
    await git.checkoutBranch('test-2');
    expect(await readTextFile(path)).toBe('change');
  });

  it('brings the local changes to a newly created branch - with project.json', async function () {
    //commit project on main
    const path = tempDir + 'project.json';
    const projectJson = simpleProject();
    FileSystem.instance.writeFileSync(path, JSON.stringify(projectJson));
    await git.commit('added original project');

    //modify project without committing
    projectJson.components[0].graph.roots[0].parameters.text = 'modified';
    FileSystem.instance.writeFileSync(path, JSON.stringify(projectJson));

    //create a new brach and do a checkout
    await git.createAndCheckoutBranch('test-branch');

    //check that the previous uncommitted change is on the new branch
    expect(await git.status()).toEqual([{ status: 'modified', path: 'project.json' }]);
    const p = JSON.parse(await readTextFile(path));
    expect(p).toEqual(projectJson);

    //move back to main, and the local changes shouldn't be here anymore
    await git.checkoutBranch('main');
    expect(await git.status()).toEqual([]);
  });

  it('can create and checkout new branches when there are no local changes', async function () {
    //commit a file
    FileSystem.instance.writeFileSync(tempDir + 'my-file.txt', 'original');
    await git.commit('added the file');

    //create a new brach and do a checkout
    await git.createAndCheckoutBranch('test-branch');

    expect(await git.status()).toEqual([]);
    expect(await git.getCurrentBranchName()).toEqual('test-branch');

    const commits = await git.getCommitsCurrentBranch();
    expect(commits.length).toEqual(2);
  });

  it('should leave local changes intact even if a checkout fails', async function () {
    const path = tempDir + 'test.txt';
    FileSystem.instance.writeFileSync(path, 'local change');

    await expectAsync(git.checkoutBranch('non-existing-branch')).toBeRejected();

    expect(await readTextFile(path)).toBe('local change');
  });

  it('should leave local changes intact even if a merge fails', async function () {
    const path = tempDir + 'test.txt';
    FileSystem.instance.writeFileSync(path, 'local change');

    await expectAsync(git.mergeToCurrentBranch('non-existing-branch')).toBeRejected();

    expect(await readTextFile(path)).toBe('local change');
  });

  it('should leave local changes intact even if creating a branch fails', async function () {
    const path = tempDir + 'test.txt';
    FileSystem.instance.writeFileSync(path, 'local change');

    await expectAsync(git.createAndCheckoutBranch('invalid &*^%')).toBeRejected();

    expect(await readTextFile(path)).toBe('local change');
  });

  it("ignores files that shouldn't be added to the repo", async function () {
    FileSystem.instance.writeFileSync(tempDir + 'project-tmp.json', 'test');
    FileSystem.instance.writeFileSync(tempDir + '.DS_Store', 'test');

    expect(await git.status()).toEqual([]);
  });

  it('ahead and behind', async function () {
    FileSystem.instance.writeFileSync(path.join(tempDir, 'a1.txt'), 'Hello World');
    await git.commit('A1 commit');

    FileSystem.instance.writeFileSync(path.join(tempDir, 'a2.txt'), 'Hello World');
    await git.commit('A2 commit');
    const a2 = await git.getHeadCommitId();

    FileSystem.instance.writeFileSync(path.join(tempDir, 'a3.txt'), 'Hello World');
    await git.commit('A3 commit');
    const a3 = await git.getHeadCommitId();

    const commits = await git.getCommitsCurrentBranch();
    expect(commits.length).toBe(4); // 3 + initial

    const { ahead, behind } = await git.aheadBehind(a2, a3);
    expect(ahead).toEqual(0);
    expect(behind).toEqual(1);
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
