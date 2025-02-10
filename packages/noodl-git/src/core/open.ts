import * as Path from 'path';
import { RepositoryDoesNotExistErrorCode } from 'dugite';

import { git } from './client';

export async function open(basePath: string): Promise<string> {
  // const path = await NodeGit.Repository.discover(this._baseDir, 0, '')
  // this.repository = await NodeGit.Repository.open(path)
  // await this._setupRepository();
  //
  // // Check for conflicts
  // try {
  //   let index = await this.repository.index();
  //   if (index.hasConflicts()) {
  //     //just guess what's "ours" and "theirs", we don't really know what state the repo is in
  //     const filePaths = await this._solveConflicts(index, INDEX_STAGE_OURS, INDEX_STAGE_THEIRS);
  //     await Promise.all(filePaths.map(path => index.addByPath(path)));
  //     await index.write();
  //     await index.writeTree();
  //   }
  // } catch (e) {
  //   console.log("VCS error when opening project: " + e);
  // }


  // Find the relative git repository path
  const repositoryPath = await getTopLevelWorkingDirectory(basePath);

  return repositoryPath;
}

/**
 * Get the absolute path to the top level working directory.
 *
 * @param path The path to a presumptive Git repository, either the root
 *             of the repository or any path within that repository.
 *
 * @returns null if the path provided doesn't reside within a Git repository.
 */
export async function getTopLevelWorkingDirectory(path: string): Promise<string | null> {
  let result;

  try {
    // Note, we use --show-cdup here instead of --show-toplevel because show-toplevel
    // dereferences symlinks and we want to resolve a path as closely as possible to
    // what the user gave us.
    result = await git(['rev-parse', '--show-cdup'], path, 'getTopLevelWorkingDirectory', {
      successExitCodes: new Set([0, 128])
    });
  } catch (err) {
    if (err.code === RepositoryDoesNotExistErrorCode) {
      return null;
    }

    throw err;
  }

  // Exit code 128 means it was run in a directory that's not a git
  // repository.
  if (result.exitCode === 128) {
    return null;
  }

  const relativePath = result.output.toString().trim();

  // No output means we're already at the root
  if (!relativePath) {
    return path;
  }

  return Path.resolve(path, relativePath);
}

/** Is the path a git repository? */
export async function isGitRepository(path: string): Promise<boolean> {
  return (await getTopLevelWorkingDirectory(path)) !== null;
}
