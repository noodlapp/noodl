import { GitError } from 'dugite';
import { git } from './client';
import { IRemote } from './models/remote';

/**
 * List the remotes, sorted alphabetically by `name`, for a repository.
 */
export async function getRemotes(basePath: string): Promise<ReadonlyArray<IRemote>> {
  const result = await git(['remote', '-v'], basePath, 'getRemotes', {
    expectedErrors: new Set([GitError.NotAGitRepository])
  });

  if (result.gitError === GitError.NotAGitRepository) {
    return [];
  }

  const output = result.output.toString();
  const lines = output.split('\n');
  const remotes = lines
    .filter((x) => x.endsWith('(fetch)'))
    .map((x) => x.split(/\s+/))
    .map((x) => ({ name: x[0], url: x[1] }));

  return remotes;
}

/** Add a new remote with the given URL. */
export async function addRemote(basePath: string, name: string, url: string): Promise<IRemote> {
  await git(['remote', 'add', name, url], basePath, 'addRemote');

  return { url, name };
}

/** Removes an existing remote, or silently errors if it doesn't exist */
export async function removeRemote(basePath: string, name: string): Promise<void> {
  const options = {
    successExitCodes: new Set([0, 2, 128])
  };

  await git(['remote', 'remove', name], basePath, 'removeRemote', options);
}

/** Changes the URL for the remote that matches the given name  */
export async function setRemoteURL(basePath: string, name: string, url: string): Promise<true> {
  await git(['remote', 'set-url', name, url], basePath, 'setRemoteURL');
  return true;
}

/**
 * Get the URL for the remote that matches the given name.
 *
 * Returns null if the remote could not be found
 */
export async function getRemoteURL(basePath: string, name: string): Promise<string | null> {
  const result = await git(['remote', 'get-url', name], basePath, 'getRemoteURL', {
    successExitCodes: new Set([0, 2, 128])
  });

  if (result.exitCode !== 0) {
    return null;
  }

  return result.output.toString();
}
