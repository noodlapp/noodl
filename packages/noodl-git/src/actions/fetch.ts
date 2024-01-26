import { fetch as gitFetch } from '../core/fetch';
import { IGitResult } from '../core/git-error';
import { IFetchProgress } from '../core/models/progress';
import { IRemote } from '../core/models/remote';
import { createErrorFromMessage } from './git-action-error';

export async function fetch(
  repositoryDir: string,
  remote: IRemote,
  progressCallback?: (progress: IFetchProgress) => void
): Promise<IGitResult> {
  try {
    return await gitFetch(repositoryDir, remote, progressCallback);
  } catch (error) {
    throw createErrorFromMessage(error.toString());
  }
}
