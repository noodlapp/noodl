import { Branch } from '../core/models/branch';
import { IPullProgress } from '../core/models/progress';
import { IRemote } from '../core/models/remote';
import { pull as gitPull } from '../core/pull';
import { createErrorFromMessage, GitActionError, GitActionErrorCode } from './git-action-error';

export async function pull(
  repositoryDir: string,
  remote: IRemote,
  branch: Branch | string,
  progressCallback?: (progress: IPullProgress) => void
): Promise<void> {
  try {
    return await gitPull(repositoryDir, remote, branch, progressCallback);
  } catch (error) {
    throw createErrorFromMessage(error.toString());
  }
}
