import fs from 'fs';
import path from 'path';
import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

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

  it('can pull and merge remote commits', async function () {
    //create new file on localA
    FileSystem.instance.writeFileSync(path.join(localDirA, 'test.txt'), 'localA file');
    await localGitA.commit('A added file');
    await localGitA.push();

    //pull it down on localB
    await localGitB.pull({});
    expect(await readTextFile(path.join(localDirB, 'test.txt'))).toBe('localA file');

    //modify it on localA
    FileSystem.instance.writeFileSync(path.join(localDirA, 'test.txt'), 'localA mod');
    await localGitA.commit('A modified file');
    await localGitA.push();

    //modify it on localB
    FileSystem.instance.writeFileSync(path.join(localDirB, 'test.txt'), 'localB mod');
    await localGitB.commit('B modified file');

    //pull it down
    await localGitB.pull({});

    //should have been resolved to latest localB modification
    expect(await readTextFile(path.join(localDirB, 'test.txt'))).toBe('localB mod');

    const commits = await localGitB.getCommitsCurrentBranch();

    expect(commits.length).toEqual(5);

    expect(commits[0].message).toEqual('Merge origin/main into main');
    expect(commits[1].message).toEqual('B modified file');
    expect(commits[2].message).toEqual('A modified file');
    expect(commits[3].message).toEqual('A added file');
    expect(commits[4].message).toEqual('initial commit');
  });

  it('can pull and merge remote commits when a file is added both on remote and locally', async function () {
    //create new file on localA and push
    FileSystem.instance.writeFileSync(path.join(localDirA, 'test.txt'), 'A file in localA');
    FileSystem.instance.writeFileSync(path.join(localDirA, '.DS_Store'), 'asdasd');
    await localGitA.commit('A added file');
    await localGitA.push();

    //add it in localB, and then pull
    FileSystem.instance.writeFileSync(path.join(localDirB, 'test.txt'), 'A file in localB');
    FileSystem.instance.writeFileSync(path.join(localDirB, '.DS_Store'), '453456');
    await localGitB.pull({});
    expect(await readTextFile(path.join(localDirB, 'test.txt'))).toBe('A file in localB');

    // Check all the commits
    const commits = await localGitB.getCommitsCurrentBranch();
    expect(commits.length).toBe(2);
    expect(commits[0].message).toBe('A added file');
    expect(commits[1].message).toBe('initial commit');

    const status = await localGitB.status();
    expect(status.length).toBe(1);
    expect(status[0]).toEqual({ status: 'modified', path: 'test.txt' });
  });

  it('can pull and merge remote commits when a commits and a file is added both on remote and locally', async function () {
    await localGitB.pull({});
    FileSystem.instance.writeFileSync(path.join(localDirB, 'b.txt'), 'asdasd');
    await localGitB.commit('B commit');
    await localGitB.push();

    //create new file on localA and push
    await localGitA.pull({});
    FileSystem.instance.writeFileSync(path.join(localDirA, 'test.txt'), 'A file in localA');
    FileSystem.instance.writeFileSync(path.join(localDirA, '.DS_Store'), 'asdasd');
    await localGitA.commit('A added file');
    await localGitA.push();

    //add it in localB, and then pull
    FileSystem.instance.writeFileSync(path.join(localDirB, 'test.txt'), 'A file in localB');
    FileSystem.instance.writeFileSync(path.join(localDirB, '.DS_Store'), '453456');
    await localGitB.pull({});
    expect(await readTextFile(path.join(localDirB, 'test.txt'))).toBe('A file in localB');

    // Check all the commits
    const commits = await localGitB.getCommitsCurrentBranch();
    expect(commits.length).toBe(3);
    expect(commits[0].message).toBe('A added file');
    expect(commits[1].message).toBe('B commit');
    expect(commits[2].message).toBe('initial commit');

    const status = await localGitB.status();
    expect(status.length).toBe(1);
    expect(status[0]).toEqual({ status: 'modified', path: 'test.txt' });
  });

  it('can reset to merge base when remote is not ahead', async function () {
    await localGitA.createAndCheckoutBranch('A');

    FileSystem.instance.writeFileSync(path.join(localDirA, 'test.txt'), 'file');
    await localGitA.commit('A commit');
    await localGitA.push();

    await localGitB.fetch({});
    await localGitB.checkoutRemoteBranch('A');

    //B should now have the file
    expect(await readTextFile(path.join(localDirB, 'test.txt'))).toBe('file');

    //do a local uncommitted change
    FileSystem.instance.writeFileSync(path.join(localDirB, 'test.txt'), 'modified');

    //reset, and verify that it's back to original file
    await localGitB.resetToMergeBase();
    expect(await readTextFile(path.join(localDirB, 'test.txt'))).toBe('file');

    let commits = await localGitB.getCommitsCurrentBranch();
    expect(commits.length).toBe(2);

    //do a local committed change
    FileSystem.instance.writeFileSync(path.join(localDirB, 'test.txt'), 'modified');
    await localGitB.commit('modified file');

    commits = await localGitB.getCommitsCurrentBranch();
    expect(commits.length).toBe(3);

    //reset, and verify that it's back to original file, and commit is removed
    await localGitB.resetToMergeBase();
    expect(await readTextFile(path.join(localDirB, 'test.txt'))).toBe('file');

    commits = await localGitB.getCommitsCurrentBranch();
    expect(commits.length).toBe(2);
  });

  it('can reset to merge base when remote is ahead', async function () {
    await localGitA.createAndCheckoutBranch('A');

    FileSystem.instance.writeFileSync(path.join(localDirA, 'test.txt'), 'file');
    await localGitA.commit('A commit');
    await localGitA.push();

    await localGitB.fetch({});
    await localGitB.checkoutRemoteBranch('A');

    //do a local committed change
    FileSystem.instance.writeFileSync(path.join(localDirB, 'test.txt'), 'modified');
    await localGitB.commit('modified file');

    // TODO: Make sure the history is correct?

    //... plus a local modification
    FileSystem.instance.writeFileSync(path.join(localDirB, 'test.txt'), 'modified2');

    //localA pushed new commit to remote
    FileSystem.instance.writeFileSync(path.join(localDirA, 'test.txt'), 'file2');
    await localGitA.commit('Another commit');
    await localGitA.push();

    //localB fetches, but doesn't merge in (doesn't pull)
    await localGitB.fetch({});

    //B resets, verify that it's back to original file, and commit is removed, and remote didn't get merged in
    await localGitB.resetToMergeBase();
    expect(await readTextFile(path.join(localDirB, 'test.txt'))).toBe('file');

    const commits = await localGitB.getCommitsCurrentBranch();
    expect(commits.length).toBe(3);
    expect(commits[0].isRemoteAhead).toBe(true);

    // Lets just make sure the commits are in the right order
    expect(commits[0].message).toBe('Another commit');
    expect(commits[1].message).toBe('A commit');
    expect(commits[2].message).toBe('initial commit');
  });

  it('can handle merge with conflicts in project.json', async function () {
    const localDirA_projectPath = path.join(localDirA, 'project.json');
    const localDirB_projectPath = path.join(localDirB, 'project.json');

    // Git A
    // Write a simple project file to localDirA
    fs.writeFileSync(localDirA_projectPath, JSON.stringify(simpleProject()));

    // We now have 1 file, project.json
    const statusA1 = await localGitA.status();
    expect(statusA1.length).toEqual(1);

    // Commit and add remote
    await localGitA.commit('add project.json');

    // Git B
    // Do all the changes on Git B without remote
    await localGitB.clone({ url: remoteDir, directory: localDirB });

    // Write a simple project file with changes to localDirB
    const modifiedProjectTestBranch = simpleProject();
    modifiedProjectTestBranch.components[0].graph.roots[0].parameters.text = 'changed';
    fs.writeFileSync(localDirB_projectPath, JSON.stringify(modifiedProjectTestBranch));

    // We now have 1 file, project.json
    const statusB1 = await localGitB.status();
    expect(statusB1.length).toEqual(1);

    // Commit and push to remote
    await localGitB.commit('commit');

    // Merge
    await localGitA.push();
    await localGitB.pull({});
    await localGitB.push();

    const proj = JSON.parse(await fs.promises.readFile(localDirB_projectPath, 'utf8'));

    const conflicts = proj.components[0].graph.roots[0].conflicts;
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].name).toBe('text');
    expect(conflicts[0].ours).toBe('changed');
    expect(conflicts[0].theirs).toBe('original');
  });

  it('Merge with conflicts everywhere, even in stash', async function () {
    const localDirA_projectPath = path.join(localDirA, 'project.json');
    const localDirB_projectPath = path.join(localDirB, 'project.json');

    // Git A
    // Write a simple project file to localDirA
    fs.writeFileSync(localDirA_projectPath, JSON.stringify(simpleProject()));

    // We now have 1 file, project.json
    const statusA1 = await localGitA.status();
    expect(statusA1.length).toEqual(1);

    // Commit and add remote
    await localGitA.commit('add project.json');

    // Git B
    // Do all the changes on Git B without remote
    await localGitB.clone({ url: remoteDir, directory: localDirB });

    // Write a simple project file with changes to localDirB
    const modifiedProjectTestBranch = simpleProject();
    modifiedProjectTestBranch.components[0].graph.roots[0].parameters.text = 'changed';
    fs.writeFileSync(localDirB_projectPath, JSON.stringify(modifiedProjectTestBranch));

    // We now have 1 file, project.json
    const statusB1 = await localGitB.status();
    expect(statusB1.length).toEqual(1);

    // Commit and push to remote
    await localGitB.commit('commit');

    // Write a simple project file with changes to localDirB
    const modifiedProjectTestBranch2 = simpleProject();
    modifiedProjectTestBranch2.components[0].graph.roots[0].parameters.text = 'stashed';
    fs.writeFileSync(localDirB_projectPath, JSON.stringify(modifiedProjectTestBranch2));

    // Merge
    await localGitA.push();
    await localGitB.pull({});
    await localGitB.push();

    const proj = JSON.parse(await fs.promises.readFile(localDirB_projectPath, 'utf8'));

    const entry = proj.components[0].graph.roots[0];
    expect(entry.parameters.text).toBe('stashed');
  });
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
