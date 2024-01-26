import { git, GitExecutionOptions, gitNetworkArguments } from './client';
import { Branch, BranchType } from './models/branch';
import { ICheckoutProgress } from './models/progress';
import { CheckoutProgressParser, executionOptionsWithProgress } from './progress';
import { AuthenticationErrors } from './authentication';

export type ProgressCallback = (progress: ICheckoutProgress) => void;

export type CheckoutFlags = {
  force?: boolean;
  commitish?: string;
};

async function getCheckoutArgs(
  repositoryDir: string,
  branch: Branch,
  flags?: CheckoutFlags,
  progressCallback?: ProgressCallback
) {
  const networkArguments = await gitNetworkArguments(repositoryDir);

  let baseArgs =
    progressCallback != null ? [...networkArguments, 'checkout', '--progress'] : [...networkArguments, 'checkout'];

  // Add the flags
  if (flags?.force) baseArgs.push('--force');

  if (branch.type === BranchType.Remote) {
    if (flags?.commitish) {
      return baseArgs.concat(branch.name, '-b', branch.nameWithoutRemote, flags.commitish, '--');
    }
    return baseArgs.concat(branch.name, '-b', branch.nameWithoutRemote, '--');
  }

  return baseArgs.concat(branch.name, '--');
}

/**
 * Check out the given branch.
 *
 * @param repository - The repository in which the branch checkout should
 *                     take place
 *
 * @param branch     - The branch name that should be checked out
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the checkout operation. When provided this
 *                           enables the '--progress' command line flag for
 *                           'git checkout'.
 */
export async function checkoutBranch(
  repositoryDir: string,
  branch: Branch,
  flags?: CheckoutFlags,
  progressCallback?: ProgressCallback
): Promise<true> {
  let opts: GitExecutionOptions = {
    env: {},
    expectedErrors: AuthenticationErrors
  };

  if (progressCallback) {
    const title = `Checking out branch ${branch.name}`;
    const kind = 'checkout';
    const targetBranch = branch.name;

    opts = await executionOptionsWithProgress(opts, new CheckoutProgressParser(), (progress) => {
      if (progress.kind === 'progress') {
        const description = progress.details.text;
        const value = progress.percent;

        progressCallback({ kind, title, description, value, targetBranch });
      }
    });

    // Initial progress
    progressCallback({ kind, title, value: 0, targetBranch });
  }

  const args = await getCheckoutArgs(repositoryDir, branch, flags, progressCallback);

  await git(args, repositoryDir, 'checkoutBranch', opts);

  // we return `true` here so `GitStore.performFailableGitOperation`
  // will return _something_ differentiable from `undefined` if this succeeds
  return true;
}
