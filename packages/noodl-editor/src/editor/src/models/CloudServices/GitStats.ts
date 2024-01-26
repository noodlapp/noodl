import { Git } from '@noodl/git';

import { mergeProject } from '@noodl-utils/projectmerger';

import { ProjectModel } from '../projectmodel';

/**
 * Git stats used for deployment of frontend.
 */
export async function getGitStats() {
  try {
    const git = new Git(mergeProject);
    await git.openRepository(ProjectModel.instance._retainedProjectDirectory);

    const gitBranch: string = await git.getCurrentBranchName();
    const gitSha: string = await git.getHeadCommitId();
    const gitLocalChanges: boolean = (await git.status()).length > 0;
    return { gitBranch, gitSha, gitLocalChanges };
  } catch (err) {
    console.error(err);
  }

  return {
    gitBranch: 'unknown',
    gitSha: 'unknown',
    gitLocalChanges: false
  };
}
