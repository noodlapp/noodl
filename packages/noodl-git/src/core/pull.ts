import { AuthenticationErrors } from './authentication';
import { git, GitExecutionOptions, gitNetworkArguments } from './client';
import { GitError } from './git-error';
import { Branch } from './models/branch';
import { IPullProgress } from './models/progress';
import { IRemote } from './models/remote';
import { PullProgressParser, executionOptionsWithProgress } from './progress';

/**
 * Returns the arguments to use on any git operation that can end up
 * triggering a rebase.
 */
function gitRebaseArguments() {
  return [
    // Explicitly set the rebase backend to merge.
    // We need to force this option to be sure that Desktop
    // uses the merge backend even if the user has the apply backend
    // configured, since this is the only one supported.
    // This can go away once git deprecates the apply backend.
    '-c',
    'rebase.backend=merge'
  ];
}

async function getPullArgs(
  repositoryDir: string,
  remote: string,
  branch: string,
  progressCallback?: (progress: IPullProgress) => void
) {
  const networkArguments = await gitNetworkArguments(repositoryDir);

  const args = [...networkArguments, ...gitRebaseArguments(), 'pull'];

  if (progressCallback != null) {
    args.push('--progress');
  }

  args.push(remote);
  args.push(branch);
  args.push('--rebase'); //this is used to reconcile the divergent branches so git doesn't complain, and to prevent merge commits when you have local changes

  return args;
}

/**
 * Pull from the specified remote.
 *
 * @param repository - The repository in which the pull should take place
 *
 * @param remote     - The name of the remote that should be pulled from
 *
 * @param branch
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the pull operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git pull'.
 */
export async function pull(
  repositoryDir: string,
  remote: IRemote,
  branch: Branch | string,
  progressCallback?: (progress: IPullProgress) => void
): Promise<void> {
  let opts: GitExecutionOptions = {
    expectedErrors: AuthenticationErrors
  };

  if (progressCallback) {
    const title = `Pulling ${remote.name}`;
    const kind = 'pull';

    opts = await executionOptionsWithProgress({ ...opts }, new PullProgressParser(), (progress) => {
      // In addition to progress output from the remote end and from
      // git itself, the stderr output from pull contains information
      // about ref updates. We don't need to bring those into the progress
      // stream so we'll just punt on anything we don't know about for now.
      if (progress.kind === 'context') {
        if (!progress.text.startsWith('remote: Counting objects')) {
          return;
        }
      }

      const description = progress.kind === 'progress' ? progress.details.text : progress.text;

      const value = progress.percent;

      progressCallback({
        kind,
        title,
        description,
        value,
        remote: remote.name
      });
    });

    // Initial progress
    progressCallback({ kind, title, value: 0, remote: remote.name });
  }

  const args = await getPullArgs(
    repositoryDir,
    remote.name,
    typeof branch === 'object' ? branch.name : branch,
    progressCallback
  );
  const result = await git(args, repositoryDir, 'pull', opts);

  if (result.gitErrorDescription) {
    throw new GitError(result, args);
  }
}
