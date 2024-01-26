import { app } from '@electron/remote';
import { Git } from '@noodl/git';

import FileSystem from '@noodl-utils/filesystem';
import { mergeProject } from '@noodl-utils/projectmerger';
import Utils from '@noodl-utils/utils';

describe('Git status tests', function () {
  let git: Git;
  let tempDir: string | undefined;

  beforeEach(async function () {
    tempDir = app.getPath('temp') + '/noodlunittests-git-' + Utils.guid() + '/';
    FileSystem.instance.makeDirectorySync(tempDir);

    git = new Git(mergeProject);
    await git.initNewRepo(tempDir);
  });

  afterEach(function (done) {
    FileSystem.instance.removeDirectoryRecursive(tempDir, done);
    tempDir = undefined;
  });

  it('create file', async function () {
    FileSystem.instance.writeFileSync(tempDir + 'file.txt', 'text');
    const status = await git.status();

    expect(status).toEqual([
      {
        status: 'new',
        path: '.gitattributes'
      },
      {
        status: 'new',
        path: '.gitignore'
      },
      {
        status: 'new',
        path: 'file.txt'
      }
    ]);
  });

  it('create file, commit and update file', async function () {
    FileSystem.instance.writeFileSync(tempDir + 'file.txt', 'text');

    const status1 = await git.status();
    expect(status1).toEqual([
      {
        status: 'new',
        path: '.gitattributes'
      },
      {
        status: 'new',
        path: '.gitignore'
      },
      {
        status: 'new',
        path: 'file.txt'
      }
    ]);

    await git.commit('add file.txt');

    FileSystem.instance.writeFileSync(tempDir + 'file.txt', 'text2');

    const status2 = await git.status();
    expect(status2).toEqual([
      {
        status: 'modified',
        path: 'file.txt'
      }
    ]);
  });
});
