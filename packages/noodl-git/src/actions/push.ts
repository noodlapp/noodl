import { Branch } from '../core/models/branch';
import { IPushProgress } from '../core/models/progress';
import { push as gitPush } from '../core/push';
import { createErrorFromMessage, GitActionError, GitActionErrorCode } from './git-action-error';
import { getRemote } from './remote';

interface PushOptions {
  baseDir: string;
  currentBranch: Branch;

  onProgress?: (progress: IPushProgress) => void;
}

export async function push({ baseDir, currentBranch, onProgress }: PushOptions): Promise<boolean> {
  const remote = await getRemote(baseDir);

  try {
    return await gitPush(
      baseDir,
      remote,
      currentBranch.nameWithoutRemote,
      currentBranch.upstreamWithoutRemote,
      [],
      undefined,
      onProgress
    );
  } catch (error) {
    const message = error.toString();
    if (message.includes('Updates were rejected because the remote contains work that you do')) {
      throw new Error(
        'Updates were rejected because there are new changes that you do not have locally. Pull to get the latest changes.'
      );
    }

    throw createErrorFromMessage(error.toString());
  }
}
