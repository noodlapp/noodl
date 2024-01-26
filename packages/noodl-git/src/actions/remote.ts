import { IRemote } from '../core/models/remote';
import { getRemotes, setRemoteURL as _setRemoteURL } from '../core/remotes';
import { GitActionError, GitActionErrorCode } from './git-action-error';

/**
 * Returns a single remote.
 *
 * @param repositoryDir
 * @throws {GitHelperError}
 * @returns A single remote.
 */
export async function getRemote(repositoryDir: string): Promise<Readonly<IRemote>> {
  const remotes = await getRemotes(repositoryDir);

  if (remotes.length === 0) {
    // When there are no remotes, we assume that the repository is local only.
    // This might not always be the case,
    // but ideally a remote branch should have been created.
    throw new GitActionError(GitActionErrorCode.LocalRepository);
  }

  // TODO: It would be nice if the git client selects a default remote
  //       and then we work from that remote, so you can
  //       technically have many different remotes at once.
  return remotes[0];
}

export async function setRemoteURL(repositoryDir: string, remoteName: string, url: string): Promise<void> {
  await _setRemoteURL(repositoryDir, remoteName, url);
}
