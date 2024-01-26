import { git, GitExecutionOptions, gitNetworkArguments } from './client';
import { ICloneProgress } from './models/progress';
import { CloneOptions } from './models/clone-options';
import { CloneProgressParser, executionOptionsWithProgress } from './progress';
import { DEFAULT_BRANCH } from '../constants';
import { IGitResult } from './git-error';
import { app } from '@electron/remote';
import { join } from 'path';

/**
 * Clones a repository from a given url into to the specified path.
 *
 * @param url     - The remote repository URL to clone from
 *
 * @param path    - The destination path for the cloned repository. If the
 *                  path does not exist it will be created. Cloning into an
 *                  existing directory is only allowed if the directory is
 *                  empty.
 *
 * @param options  - Options specific to the clone operation, see the
 *                   documentation for CloneOptions for more details.
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the clone operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git clone'.
 *
 */
export async function clone(
  url: string,
  path: string,
  options: CloneOptions,
  progressCallback?: (progress: ICloneProgress) => void
): Promise<IGitResult> {
  const networkArguments = await gitNetworkArguments(null);
  const defaultBranch = options.defaultBranch ?? DEFAULT_BRANCH;

  const args = [...networkArguments, '-c', `init.defaultBranch=${defaultBranch}`, 'clone', '--recursive'];

  let opts: GitExecutionOptions = {};

  if (progressCallback) {
    args.push('--progress');

    const title = `Cloning into ${path}`;
    const kind = 'clone';

    opts = await executionOptionsWithProgress({ ...opts }, new CloneProgressParser(), (progress) => {
      const description = progress.kind === 'progress' ? progress.details.text : progress.text;
      const value = progress.percent;

      progressCallback({ kind, title, description, value });
    });

    // Initial progress
    progressCallback({ kind, title, value: 0 });
  }

  if (options.branch) {
    args.push('-b', options.branch);
  } else if (defaultBranch) {
    args.push('-b', defaultBranch);
  }

  if (options.singleBranch) {
    args.push('--single-branch');
  }

  args.push('--', url, path);

  const cwdPath = join(app.getAppPath(), '..');
  return await git(args, cwdPath, 'clone', opts);
}
