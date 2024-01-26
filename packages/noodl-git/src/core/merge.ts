import fs from 'fs';
import * as Path from 'path';

import { git } from './client';
import { GitError } from 'dugite';
import { Branch } from './models/branch';
import { MergeTreeResult } from './models/merge';
import { ComputedAction } from './models/computed-action';
import { parseMergeTreeResult } from './merge-tree-parser';

export enum MergeResult {
  /** The merge completed successfully */
  Success,
  /**
   * The merge was a noop since the current branch
   * was already up to date with the target branch.
   */
  AlreadyUpToDate,
  /**
   * The merge failed, likely due to conflicts.
   */
  Failed
}

/** Merge the named branch into the current branch. */
export async function merge(
  repositoryDir: string,
  branch: string,
  options: {
    strategy?: string;
    strategyOption?: string;
    isSquash?: boolean;
    squashNoCommit?: boolean;
    message?: string;
    noFastForward?: boolean;
  }
): Promise<MergeResult> {
  const args = ['merge'];

  if (options.message) {
    args.push('-m', options.message);
  }

  if (options.isSquash) {
    args.push('--squash');
  } else if (options.noFastForward) {
    // No Fast Forward, meaning that there will always be a merge commit.
    args.push('--no-ff');
  }

  if (options.strategy) {
    args.push('--strategy', options.strategy);
  }

  if (options.strategyOption) {
    args.push('--strategy-option', options.strategyOption);
  }

  args.push(branch);

  const { exitCode, output } = await git(args, repositoryDir, 'merge', {
    expectedErrors: new Set([GitError.MergeConflicts])
  });

  if (exitCode !== 0) {
    return MergeResult.Failed;
  }

  if (options.isSquash && !options.squashNoCommit) {
    const squashArgs = ['commit', '--no-edit'];

    if (options.message) {
      squashArgs.push('-m', options.message);
    }

    const { exitCode } = await git(squashArgs, repositoryDir, 'merge');
    if (exitCode !== 0) {
      return MergeResult.Failed;
    }
  }

  return output.toString() === noopMergeMessage ? MergeResult.AlreadyUpToDate : MergeResult.Success;
}

const noopMergeMessage = 'Already up to date.\n';

/**
 * Find the base commit between two commit-ish identifiers
 *
 * @returns the commit id of the merge base, or null if the two commit-ish
 *          identifiers do not have a common base
 */
export async function getMergeBase(
  repositoryDir: string,
  firstCommitish: string,
  secondCommitish: string
): Promise<string | null> {
  const process = await git(['merge-base', firstCommitish, secondCommitish], repositoryDir, 'merge-base', {
    // - 1 is returned if a common ancestor cannot be resolved
    // - 128 is returned if a ref cannot be found
    //   "warning: ignoring broken ref refs/remotes/origin/main."
    successExitCodes: new Set([0, 1, 128])
  });

  if (process.exitCode === 1 || process.exitCode === 128) {
    return null;
  }

  return process.output.toString().trim();
}

/**
 * Generate the merge result from two branches in a repository
 *
 * @param repository The repository containing the branches to merge
 * @param ours The current branch
 * @param theirs Another branch to merge into the current branch
 */
export async function mergeTree(repositoryDir: string, ours: Branch, theirs: Branch): Promise<MergeTreeResult | null> {
  const mergeBase = await getMergeBase(repositoryDir, ours.tip.sha, theirs.tip.sha);

  if (mergeBase === null) {
    return { kind: ComputedAction.Invalid };
  }

  if (mergeBase === ours.tip.sha || mergeBase === theirs.tip.sha) {
    return { kind: ComputedAction.Clean, entries: [] };
  }

  const result = await git(['merge-tree', mergeBase, ours.tip.sha, theirs.tip.sha], repositoryDir, 'mergeTree');

  const output = result.output.toString();

  if (output.length === 0) {
    // the merge commit will be empty - this is fine!
    return { kind: ComputedAction.Clean, entries: [] };
  }

  return parseMergeTreeResult(output);
}

export async function mergeTreeCommit(
  repositoryDir: string,
  oursCommitish: string,
  theirsCommitish: string
): Promise<MergeTreeResult | null> {
  const mergeBase = await getMergeBase(repositoryDir, oursCommitish, theirsCommitish);

  if (mergeBase === null) {
    return { kind: ComputedAction.Invalid };
  }

  if (mergeBase === oursCommitish || mergeBase === theirsCommitish) {
    return { kind: ComputedAction.Clean, entries: [] };
  }

  const result = await git(['merge-tree', mergeBase, oursCommitish, theirsCommitish], repositoryDir, 'mergeTree');

  const output = result.output.toString();

  if (output.length === 0) {
    // the merge commit will be empty - this is fine!
    return { kind: ComputedAction.Clean, entries: [] };
  }

  return parseMergeTreeResult(output);
}

/**
 * Abort a mid-flight (conflicted) merge
 *
 * @param repository where to abort the merge
 */
export async function abortMerge(repositoryDir: string): Promise<void> {
  await git(['merge', '--abort'], repositoryDir, 'abortMerge');
}

/**
 * Check the `.git/MERGE_HEAD` file exists in a repository to confirm
 * that it is in a conflicted state.
 */
export async function isMergeHeadSet(repositoryDir: string): Promise<boolean> {
  const path = Path.join(repositoryDir, '.git', 'MERGE_HEAD');

  // NOTE: access calls reject, which causes issues with devtools.
  return new Promise<boolean>((resolve) => {
    resolve(fs.existsSync(path));
  });
}

/**
 * Check the `.git/SQUASH_MSG` file exists in a repository
 * This would indicate we did a merge --squash and have not committed.. indicating
 * we have detected a conflict.
 *
 * Note: If we abort the merge, this doesn't get cleared automatically which
 * could lead to this being erroneously available in a non merge --squashing scenario.
 */
export async function isSquashMsgSet(repositoryDir: string): Promise<boolean> {
  const path = Path.join(repositoryDir, '.git', 'SQUASH_MSG');

  // NOTE: access calls reject, which causes issues with devtools.
  return new Promise<boolean>((resolve) => {
    resolve(fs.existsSync(path));
  });
}
