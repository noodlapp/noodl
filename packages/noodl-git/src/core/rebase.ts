import Path from 'path';
import fs from 'fs';

/**
 * Rebase internal state used to track how and where the rebase is applied to
 * the repository.
 */
export type RebaseInternalState = {
  /** The branch containing commits that should be rebased */
  readonly targetBranch: string;
  /**
   * The commit ID of the base branch, to be used as a starting point for
   * the rebase.
   */
  readonly baseBranchTip: string;
  /**
   * The commit ID of the target branch at the start of the rebase, which points
   * to the original commit history.
   */
  readonly originalBranchTip: string;
};

/** The app-specific results from attempting to rebase a repository */
export enum RebaseResult {
  /**
   * Git completed the rebase without reporting any errors, and the caller can
   * signal success to the user.
   */
  CompletedWithoutError = 'CompletedWithoutError',
  /**
   * The rebase encountered conflicts while attempting to rebase, and these
   * need to be resolved by the user before the rebase can continue.
   */
  ConflictsEncountered = 'ConflictsEncountered',
  /**
   * The rebase was not able to continue as tracked files were not staged in
   * the index.
   */
  OutstandingFilesNotStaged = 'OutstandingFilesNotStaged',
  /**
   * The rebase was not attempted because it could not check the status of the
   * repository. The caller needs to confirm the repository is in a usable
   * state.
   */
  Aborted = 'Aborted',
  /**
   * An unexpected error as part of the rebase flow was caught and handled.
   *
   * Check the logs to find the relevant Git details.
   */
  Error = 'Error'
}

/**
 * Check the `.git/REBASE_HEAD` file exists in a repository to confirm
 * a rebase operation is underway.
 */
async function isRebaseHeadSet(repositoryDir: string): Promise<boolean> {
  const path = Path.join(repositoryDir, '.git', 'REBASE_HEAD');

  // NOTE: access calls reject, which causes issues with devtools.
  // return fs.promises.access(path).then(constant(true), constant(false));

  return new Promise<boolean>((resolve) => {
    resolve(fs.existsSync(path));
  });
}

/**
 * Get the internal state about the rebase being performed on a repository. This
 * information is required to help Desktop display information to the user
 * about the current action as well as the options available.
 *
 * Returns `null` if no rebase is detected, or if the expected information
 * cannot be found in the repository.
 */
export async function getRebaseInternalState(repositoryDir: string): Promise<RebaseInternalState | null> {
  const isRebase = await isRebaseHeadSet(repositoryDir);

  if (!isRebase) {
    return null;
  }

  let originalBranchTip: string | null = null;
  let targetBranch: string | null = null;
  let baseBranchTip: string | null = null;

  try {
    originalBranchTip = await fs.promises.readFile(
      Path.join(repositoryDir, '.git', 'rebase-merge', 'orig-head'),
      'utf8'
    );

    originalBranchTip = originalBranchTip.trim();

    targetBranch = await fs.promises.readFile(Path.join(repositoryDir, '.git', 'rebase-merge', 'head-name'), 'utf8');

    if (targetBranch.startsWith('refs/heads/')) {
      targetBranch = targetBranch.substring(11).trim();
    }

    baseBranchTip = await fs.promises.readFile(Path.join(repositoryDir, '.git', 'rebase-merge', 'onto'), 'utf8');

    baseBranchTip = baseBranchTip.trim();
  } catch {}

  if (originalBranchTip != null && targetBranch != null && baseBranchTip != null) {
    return { originalBranchTip, targetBranch, baseBranchTip };
  }

  // unable to resolve the rebase state of this repository

  return null;
}
