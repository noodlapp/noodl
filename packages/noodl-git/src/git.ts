import { removeSync } from 'fs-extra';
import { sortBy } from 'underscore';

import { createErrorFromMessage, fetch, GitActionError, GitActionErrorCode } from './actions';
import { getRemote, setRemoteURL } from './actions/remote';
import { DEFAULT_BRANCH } from './constants';
import { addAll } from './core/add';
import { appendGitAttributes } from './core/attributes';
import { currentBranchName, createBranch } from './core/branch';
import { checkoutBranch } from './core/checkout';
import { cleanUntrackedFiles } from './core/clean';
import { git } from './core/client';
import { clone } from './core/clone';
import { createCommit } from './core/commit';
import { getConfigValue, setConfigValue } from './core/config';
import { getBranchesOld } from './core/for-each-ref';
import { appendGitIgnore } from './core/ignore';
import { init, installMergeDriver } from './core/init';
import { getChangedFiles, getCommits } from './core/logs';
import { merge, getMergeBase, mergeTree, mergeTreeCommit } from './core/merge';
import { BranchType } from './core/models/branch';
import { ComputedAction } from './core/models/computed-action';
import { IFetchProgress } from './core/models/progress';
import { Commit } from './core/models/snapshot';
import { open } from './core/open';
import { push, pushDelete } from './core/push';
import { refhead } from './core/refs';
import { getRemotes, addRemote, getRemoteURL } from './core/remotes';
import { GitResetMode, reset } from './core/reset';
import { getAheadBehind, revRange, revSymmetricDifference } from './core/rev-list';
import { getAllTags } from './core/show-ref';
import { popStashEntry, createStashEntry, getStashes, popStashEntryToBranch } from './core/stash';
import { getStatus } from './core/status';
import { deleteRef } from './core/update-ref';
import { cleanMergeDriverOptionsSync, writeMergeDriverOptions } from './merge-driver';
import { MergeStrategy, MergeStrategyFunc } from './merge-strategy';
import {
  GitStatus,
  GitCommit,
  GitBranch,
  GitCloneOptions,
  ConvertStatusKindToGitStatus,
  GitEmptyRepositoryError
} from './models';

export enum CommitState {
  NONE = 0,
  LOCAL = 1 << 0,
  REMOTE = 1 << 1
}

export interface FetchOptions {
  onProgress?: (progress: IFetchProgress) => void;
}

export interface PullOptions {
  onProgress?: (progress: IFetchProgress) => void;
}

export function createSquashMessage(branchName: string) {
  return `Squashed commit from branch '${branchName}'`;
}

export function createMergeMessage(theirsBranchName: string, oursBranchName: string): string {
  return `Merge ${theirsBranchName} into ${oursBranchName}`;
}

export type GitProvider = 'noodl' | 'github' | 'unknown' | 'none';

/**
 * NOTE: Don't change the methods here, they are the same as in Noodl Editor right now!
 * NOTE: I have added some return values in some places where there were none before.
 */
export class Git {
  public get repositoryPath() {
    return this.baseDir;
  }

  private baseDir: string | null = null;
  private originProvider: GitProvider | null = null;
  private originUrl: string = null;

  get Provider() {
    return this.originProvider;
  }

  get OriginUrl() {
    return this.originUrl;
  }

  constructor(private readonly mergeProject: MergeStrategyFunc) {}

  /**
   * Initialize a new git repository in the given path.
   *
   * @param baseDir
   */
  async initNewRepo(baseDir: string, options?: { bare: boolean }): Promise<void> {
    if (this.baseDir) return;

    this.baseDir = await init(baseDir, options);
    await this._setupRepository();
  }

  /**
   * Open a git repository in the given path.
   *
   * @param baseDir
   */
  async openRepository(baseDir: string): Promise<void> {
    if (this.baseDir) return;

    this.baseDir = await open(baseDir);
    await this._setupRepository();
  }

  /**
   * Clone a new repository.
   *
   * @param options
   */
  async clone({ url, directory, singleBranch, onProgress }: GitCloneOptions): Promise<void> {
    if (this.baseDir) return;

    async function _clone() {
      try {
        return await clone(url, directory, { branch: 'main', singleBranch }, (progress) => {
          onProgress && onProgress(progress);
        });
      } catch (exc) {
        try {
          return await clone(url, directory, { branch: 'master', singleBranch }, (progress) => {
            onProgress && onProgress(progress);
          });
        } catch (exc) {
          throw 'warning: You appear to have cloned an empty repository.';
        }
      }
    }

    try {
      await _clone();

      this.baseDir = directory;
      await this._setupRepository();
    } catch (exc) {
      if (exc && exc.toString().includes('warning: You appear to have cloned an empty repository.')) {
        // Remove the directory when it fails
        removeSync(directory);
        throw new GitEmptyRepositoryError();
      }
    }
  }

  /**
   * List the remotes, sorted alphabetically by `name`, for a repository.
   *
   * @returns
   */
  async getRemoteName(): Promise<string> {
    const remotes = await getRemotes(this.baseDir);
    return remotes.length ? remotes[0].name : undefined;
  }

  /**
   * Add a new remote with the given URL.
   *
   * @param remoteURL
   */
  async addRemote(remoteURL: string): Promise<void> {
    await addRemote(this.baseDir, 'origin', remoteURL);
  }

  /**
   *
   * @param message
   * @returns Commit SHA
   */
  async commit(message: string): Promise<string> {
    // Cannot commit when there are no changes
    const status = await this.status();
    if (status.length === 0) throw new Error('Cannot commit without any local changes.');

    // Stage all changes, and untracked files
    // NOTE: This can be done with the commit command
    await addAll(this.baseDir);

    // Commit the changes
    return await createCommit(this.baseDir, message);
  }

  /**
   * Returns the status of the current git state.
   *
   * @returns
   */
  async status(): Promise<GitStatus[]> {
    const statusList = await getStatus(this.baseDir);
    return statusList.files.map((x) => ({
      status: ConvertStatusKindToGitStatus(x.status.kind),
      path: x.path
    }));
  }

  /**
   * Stash the local changes.
   *
   * NOTE: This doesn't check if there are any changes.
   */
  async stashPushChanges(branchName?: string) {
    const useBranchName = branchName ?? (await currentBranchName(this.baseDir));
    const stashMarker = `!!Noodl<${useBranchName}>`;
    return await createStashEntry(this.baseDir, stashMarker);
  }

  /**
   * Pop the stash.
   */
  async stashPopChanges(branchName?: string): Promise<boolean> {
    const useBranchName = branchName ?? (await currentBranchName(this.baseDir));
    const stashMarker = `!!Noodl<${useBranchName}>`;

    const stashes = await getStashes(this.baseDir);
    const stash = stashes.entries.find((x) => x.message === stashMarker);
    if (!stash) {
      return false;
    }

    await writeMergeDriverOptions({
      reversed: true
    });

    try {
      // Pop and then we do the merge check
      await popStashEntry(this.baseDir, stash.name);
    } catch (err) {
      // Run merge on untracked files, we are not able to pop the stash when there are untracked files.
      // The solution to this is to pop the stash to a new branch, which is done via "git stash branch".
      //
      // This means that we can handle it as 2 different branches making it easier to merge.
      //
      // OKAY, GOOD LUCK! BE READY!
      //
      // So here is a story all about how I screwed up git for a very long time.
      // Lets start with a stash and then pull in some changes.
      // Then we pop our stash, but its all about untracked changes.
      // So we created a branch called !!Noodl-Stash-... with all has our (local) changes
      // Then we merge in the remote changes to our new branch without any problems
      // So I checked out the branch we are working on
      // And the squash merge all the files from without a commit in our new !!Noodl-Stash
      //
      // Yeah it doesn't really work in the end, but maybe it helps a little? Maybe makes you happy?
      //
      if (err.toString().includes('could not restore untracked files from stash')) {
        const previousBranch = await this.getCurrentBranchName();
        const stashBranchName = `!!Noodl-Stash-${stash.branchName}`;

        // Create a new branch from the stash
        // this will also checkout the branch
        await popStashEntryToBranch(this.baseDir, stash.name, stashBranchName);

        // Merge our working branch into the stash branch
        await this._merge({
          theirsBranchName: previousBranch,
          oursBranchName: stashBranchName,
          isSquash: false,
          message: undefined,
          allowFastForward: false
        });

        const changes = await this.status();
        if (changes.length > 0) {
          await this.commit('Merge stash');
        }

        // TODO: Should we make sure there are no issues?

        // Checkout the working branch
        await this.checkoutBranch(previousBranch);

        // Squash merge our stash branch into the working branch without making any commits.
        await merge(this.baseDir, stashBranchName, {
          strategy: 'recursive',
          strategyOption: 'theirs',
          isSquash: true,
          squashNoCommit: true,
          message: undefined,
          noFastForward: true
        });

        // Delete the stash branch
        await this.deleteBranch(stashBranchName);

        // And what should be left on the working branch is our stash, that we love so much!
      } else {
        // We failed to pop the stash, this shouldn't happen, but we just log the error and return false.
        console.error(err);
        return false;
      }
    } finally {
      cleanMergeDriverOptionsSync();
    }

    // Get merge information
    const headCommitish = await this.getHeadCommitId();
    const tree = await mergeTreeCommit(this.baseDir, stash.sha, headCommitish);

    // Check if there is a merge conflict
    if (tree.kind === ComputedAction.Conflicts) {
      // Solve any conflicts if there are any after reapplying the stash
      // NOTE(?): "ours" and "theirs" are reveresed, since our changes are the incoming one from the stash
      const solver = new MergeStrategy(this.baseDir, this.mergeProject);
      await solver.solveConflicts(tree);
    } else if (tree.kind !== ComputedAction.Clean) {
      throw new Error('Failed to merge stash, ' + tree.kind);
    }

    return true;
  }

  /**
   *
   * @param options
   */
  async mergeToCurrentBranch(theirsBranchName: string, squash = true, message: string = undefined): Promise<void> {
    return this._mergeToCurrentBranch({
      theirsBranchName,
      squash,
      message
    });
  }

  /**
   * Reset the current branch to HEAD.
   *
   * This will delete all local changes and
   * checkout the HEAD branch if it exists.
   */
  async resetToHead(): Promise<void> {
    // Get the current branch
    const branchName = await currentBranchName(this.baseDir);
    const branches = await getBranchesOld(this.baseDir, branchName);
    const branch = branches.find((x) => x.name === branchName);

    // Delete all the untracked files
    await cleanUntrackedFiles(this.baseDir);

    // Delete all local changes
    await reset(this.baseDir, GitResetMode.Hard, 'HEAD');

    // NOTE: Only checkout the branch if it exists
    if (branch) {
      await checkoutBranch(this.baseDir, branch, { force: true });
    }
  }

  async resetToCommitWithId(id: string): Promise<void> {
    await reset(this.baseDir, GitResetMode.Hard, id);
    await cleanUntrackedFiles(this.baseDir);
  }

  async resetToMergeBase(): Promise<void> {
    const headCommitId = await this.getHeadCommitId();
    const remoteHeadCommitId = await this.getRemoteHeadCommitId();
    if (!remoteHeadCommitId) {
      throw new Error('No remote commit to base from');
    }

    const mergeBaseId = await this.getMergeBaseCommitId(headCommitId, remoteHeadCommitId);
    await this.resetToCommitWithId(mergeBaseId);
    await cleanUntrackedFiles(this.baseDir);
  }

  /**
   *
   * @deprecated This is only used in old git panel
   *
   * @param options
   * @returns
   */
  async push(options?: { onProgress?: (args: { percent: number }) => void }): Promise<boolean> {
    const currentBranchName = await this.getCurrentBranchName();
    const remoteBranchName = currentBranchName;

    const remote = await getRemote(this.baseDir);

    try {
      return await push(this.baseDir, remote, currentBranchName, remoteBranchName, [], undefined, (progress) => {
        if (options?.onProgress) {
          options.onProgress({
            percent: progress.value
          });
        }
      });
    } catch (error) {
      const message = error.toString();
      if (message.includes('Updates were rejected because the remote contains work that you do')) {
        throw new Error(
          'Updates were rejected because there are new changes that you do not have locally. Pull to get the latest changes.'
        );
      }
      throw createErrorFromMessage(message);
    }
  }

  async fetch({ onProgress }: FetchOptions): Promise<void> {
    // Check remote origin where it is hosted
    const remoteName = await this.getRemoteName();
    const remoteUrl = await getRemoteURL(this.repositoryPath, remoteName);

    this.originUrl = remoteUrl?.trim();
    this.originProvider = this.getProviderForRemote(remoteUrl);

    if (!remoteUrl) {
      throw new GitActionError(GitActionErrorCode.LocalRepository);
    }

    // Fetch
    const remote = await getRemote(this.baseDir);
    await fetch(this.baseDir, remote, onProgress);
  }

  /**
   *
   * @returns
   */
  async hasRemoteCommits(): Promise<boolean> {
    const remoteName = await this.getRemoteName();
    const tags = await getAllTags(this.baseDir);

    const refDefault = `refs/remotes/${remoteName}/${DEFAULT_BRANCH}`;

    // Backwards compatability
    const ref_master = `refs/remotes/${remoteName}/master`;

    return tags.has(refDefault) || tags.has(ref_master);
  }

  /**
   * Returns a list of all commits.
   */
  async getCommitsCurrentBranch(): Promise<GitCommit[]> {
    const limit = 100;

    const localGitCommits = await this.getCommits(undefined, limit);
    let commits: GitCommit[] = localGitCommits.map(this.mapCommit);

    const remoteHeadId = await this.getRemoteHeadCommitId();
    if (remoteHeadId) {
      const currentBranchName = await this.getCurrentBranchName();
      const remoteGitCommits = await getCommits(this.baseDir, `origin/${currentBranchName}`, limit, undefined);

      if (commits.length > 0 && remoteGitCommits.length > 0) {
        const aheadBehind = await this.aheadBehind(commits[0].sha, remoteHeadId);
        //note: aheadBehind.ahead can be more than commits.length, primarily after merging a branch with lots of commits
        for (let i = 0; i < Math.min(commits.length, aheadBehind.ahead); i++) {
          commits[i].isLocalAhead = true;
        }
      }

      const remoteOnlyCommits = remoteGitCommits
        .filter((x) => localGitCommits.findIndex((c) => c.sha === x.sha) === -1)
        .map((x) => ({ ...this.mapCommit(x), isRemoteAhead: true }));

      commits = remoteOnlyCommits.concat(commits);
    } else {
      // there is no remote, it's a local branch
      // flag all the commits as being "ahead" of
      // the remote (even the commit that was the branching points, and commits before it)
      commits.forEach((c) => (c.isLocalAhead = true));
    }

    return commits;
  }

  /**
   * Returns the commits between the two commits excluding the base commit.
   *
   * NOTE: It's very important that the commit sha's are in the right order.
   *
   * @param baseCommitId
   * @param targetCommitId
   * @returns
   */
  async getCommitsBetween(baseCommitId: string, targetCommitId: string): Promise<GitCommit[]> {
    return (await this.getCommits(revSymmetricDifference(baseCommitId, targetCommitId), 100)).map(this.mapCommit);
  }

  async getCommitFromId(id: string): Promise<Commit | null> {
    const commits = await this.getCommits(id, 1);
    const commit = commits.length > 0 ? commits[0] : null;
    return new Commit(
      this.baseDir,
      commit.sha,
      commit.shortSha,
      commit.summary,
      commit.body,
      commit.author,
      commit.committer,
      commit.parentSHAs,
      commit.tags
    );
  }

  async getMergeBaseCommitId(id1: string, id2: string): Promise<string> {
    return await getMergeBase(this.baseDir, id1, id2);
  }

  /**
   * Returns the HEAD SHA of the current branch.
   *
   * @returns
   */
  async getHeadCommitId(): Promise<string | null> {
    const commit = await refhead(this.baseDir);
    return commit ? commit : null;
  }

  /**
   * Returns the remote latest SHA of the current branch.
   *
   * TODO: This is not a HEAD
   */
  async getRemoteHeadCommitId(): Promise<string | null> {
    const remoteName = await this.getRemoteName();
    const branchName = await this.getCurrentBranchName();
    const tags = await getAllTags(this.baseDir);
    const ref = `refs/remotes/${remoteName}/${branchName}`;

    return tags.has(ref) ? tags.get(ref) : null;
  }

  /**
   *
   * @param branchName
   */
  async getHeadCommitOnBranch(branchName: string): Promise<string | null> {
    const branches = await getBranchesOld(this.baseDir);
    const branch = branches.find((x) => x.name === branchName);
    return branch?.tip?.sha;
  }

  async currentAheadBehind(): Promise<{ ahead: number; behind: number }> {
    const currentLocalCommitId = await this.getHeadCommitId();
    const currentRemoteCommitId = await this.getRemoteHeadCommitId();
    return await this.aheadBehind(currentLocalCommitId, currentRemoteCommitId);
  }

  async aheadBehind(localCommitId: string, upstreamCommitId: string): Promise<{ ahead: number; behind: number }> {
    if (upstreamCommitId) {
      const { ahead, behind } = await getAheadBehind(
        this.baseDir,
        revSymmetricDifference(localCommitId, upstreamCommitId)
      );
      return { ahead, behind };
    } else {
      const { ahead, behind } = await getAheadBehind(this.baseDir, localCommitId);
      return { ahead, behind };
    }
  }

  async getFileDiff(baseCommitId: string, targetCommitId: string): Promise<GitStatus[]> {
    const changes = await getChangedFiles(this.baseDir, revRange(baseCommitId, targetCommitId));
    return changes.files.map((x) => ({
      status: ConvertStatusKindToGitStatus(x.status.kind),
      path: x.path
    }));
  }

  /**
   * Create a new branch from the HEAD branch.
   *
   * @param name
   */
  async createBranchFromHead(name: string): Promise<void> {
    const headCommitId = await this.getHeadCommitId();
    await createBranch(this.baseDir, name, headCommitId);
  }

  /**
   * This will:
   * 1. Create a new branch
   * 2. Stash the current changes
   * 3. Checkout the new branch
   * 4. Pop the stash changes
   *
   * @param branchName
   */
  async createAndCheckoutBranch(branchName: string): Promise<void> {
    const currentBranchName = await this.getCurrentBranchName();

    // Check if branch already exists
    const branches = await getBranchesOld(this.baseDir);
    if (branches.find((x) => x.name === branchName)) throw new Error('Branch already exists');

    // The branch name can be invalid
    try {
      await this.createBranchFromHead(branchName);
    } catch (err) {
      const message = err.toString();
      if (message.includes('fatal: cannot lock ref') || message.includes('is not a valid branch name')) {
        throw new GitActionError(GitActionErrorCode.InvalidBranchName);
      }

      throw err;
    }

    // Stash changes if there are any local changes
    const status = await this.status();
    const needsStash = status.length > 0;

    if (needsStash) {
      await this.stashPushChanges(currentBranchName);
    }

    try {
      await this.checkoutBranch(branchName);
    } catch (err) {
      throw err;
    } finally {
      if (needsStash) {
        await this.stashPopChanges(currentBranchName);
      }
    }
  }

  /**
   *
   * @param name
   */
  async checkoutRemoteBranch(name: string): Promise<void> {
    const remoteName = await this.getRemoteName();
    const refName = `refs/remotes/${remoteName}/${name}`;

    const branches = await getBranchesOld(this.baseDir);
    const remoteRef = branches.find((x) => x.ref === refName);

    await this.checkoutBranch(remoteRef.name);
  }

  /**
   * This will:
   * 1. Stash changes
   * 2. Checkout the branch
   * 3. Pop the stash changes (from the new branch; if there are any)
   *
   * @param name
   */
  async checkoutBranch(name: string, commitish?: string): Promise<void> {
    // Find the branch we want to checkout
    const branches = await getBranchesOld(this.baseDir);
    const branch = branches.find((x) => x.name === name);
    if (!branch) throw new Error('Branch not found');

    // 1. Stash changes if there are any local changes
    const status = await this.status();
    if (status.length > 0) {
      await this.stashPushChanges();
    }

    // 2. Checkout the branch
    await checkoutBranch(this.baseDir, branch, {
      force: false,
      commitish
    });

    // 3.
    try {
      await this.stashPopChanges();
    } catch {
      // if there is no stash the we don't care.
    }
  }

  /**
   * Returns the current branch name.
   */
  async getCurrentBranchName(): Promise<string> {
    const branchName = await currentBranchName(this.baseDir);
    return branchName.trim();
  }

  /**
   * Returns all the branches.
   *
   * Technical: This merges all the branches (local/remote) into one list.
   *
   * @deprecated This is only used in old git panel
   */
  async getBranches(): Promise<GitBranch[]> {
    const branches = await getBranchesOld(this.baseDir);

    const allBranches = branches
      .filter((x) => x.type === BranchType.Local)
      .map((x) => {
        return {
          name: x.name,
          local: true,
          remote: false
        };
      });

    // Update all the branches with the remote branches
    // There can be cases where you have 2 branches with the same name, just one is on a different remote.
    // Could also be cases where there are even more than just 2... Take care!
    branches
      .filter((x) => x.type === BranchType.Remote)
      .forEach((x) => {
        // For example: "origin/A"
        // In the UI we just want to display the branch name, not the remote.
        let split = x.name.split('/');
        if (split.length > 1) {
          split = split.slice(1);
        }
        const branchName = split.join('/');

        const hitIndex = allBranches.findIndex((x) => x.name === branchName);
        if (hitIndex !== -1) {
          allBranches[hitIndex].remote = true;
        } else {
          allBranches.push({
            name: branchName,
            local: false,
            remote: true
          });
        }
      });

    return sortBy(allBranches, (x) => x.name);
  }

  /**
   * Deletes a specific branch.
   *
   * @param name
   */
  async deleteBranch(name: string): Promise<void> {
    const branches = await getBranchesOld(this.baseDir);

    const branch = branches.find((x) => x.name === name && x.type === BranchType.Local);
    if (!branch) throw new Error(`Branch doesn't exist`);

    await deleteRef(this.baseDir, branch.ref);
  }

  /**
   *
   * @param name
   */
  async deleteRemoteBranch(name: string): Promise<void> {
    const remote = await getRemote(this.baseDir);
    const refName = `refs/remotes/${remote.name}/${name}`;

    const branches = await getBranchesOld(this.baseDir);
    const branch = branches.find((x) => x.ref === refName && x.type === BranchType.Remote);

    if (!branch) throw new Error('Remote Branch not found');

    await pushDelete(this.baseDir, remote.name, name);
  }

  private mapCommit(x: Commit): GitCommit {
    return {
      sha: x.sha,
      shortSha: x.shortSha,
      message: x.summary,
      date: x.author.date,
      parentCount: x.parentSHAs.length,
      author: {
        name: x.author.name,
        email: x.author.email
      },
      isLocalAhead: false,
      isRemoteAhead: false
    };
  }

  private async getCommits(revisionRange: string | null, limit: number): Promise<ReadonlyArray<Commit>> {
    return await getCommits(this.baseDir, revisionRange, limit);
  }

  /**
   * Setup the common git rules for it to work with Noodl.
   */
  private async _setupRepository() {
    await setConfigValue(this.baseDir, 'core.precomposeUnicode', 'true');
    await setConfigValue(this.baseDir, 'core.protectNTFS', 'false');
    await setConfigValue(this.baseDir, 'core.longpaths', 'true');

    await installMergeDriver(this.baseDir);

    // Ignore these files (these rules are just saved in memory, not to .gitignore)
    await appendGitIgnore(this.baseDir, ['project-tmp.json*', '.DS_Store', '__MACOSX']);

    // Create or append the .gitattributes file
    await appendGitAttributes(this.baseDir, ['project.json merge=noodl']);

    const remoteName = await this.getRemoteName();
    if (remoteName) {
      const remoteUrl = await getRemoteURL(this.repositoryPath, remoteName);
      this.originUrl = remoteUrl?.trim();
    }

    this.originProvider = this.getProviderForRemote(this.originUrl);
  }

  private async _mergeToCurrentBranch(options: {
    theirsBranchName: string;
    squash?: boolean;
    message?: string;
    allowFastForward?: boolean;
  }): Promise<void> {
    // Get the target merge branch name
    const oursBranchName = await currentBranchName(this.baseDir);

    // Stash changes if there are any local changes
    const status = await this.status();
    const needsStash = status.length > 0;

    if (needsStash) {
      await this.stashPushChanges(oursBranchName);
    }

    // Do the merge
    try {
      await this._merge({
        theirsBranchName: options.theirsBranchName,
        oursBranchName,
        isSquash: options.squash,
        message: options.message,
        allowFastForward: options.allowFastForward || true
      });
    } finally {
      // Reapply local changes
      if (needsStash) {
        await this.stashPopChanges(oursBranchName);
      }
    }
  }

  public async _merge(options: {
    message: string;
    /**
     * Previously this was called: fromBranchName
     */
    theirsBranchName: string;
    /**
     * Previously this was called: targetBranchName
     */
    oursBranchName: string;
    isSquash: boolean;
    squashNoCommit?: boolean;
    allowFastForward: boolean;
  }): Promise<void> {
    const branches = await getBranchesOld(this.baseDir);
    const ours = branches.find((x) => x.name === options.oursBranchName);
    const theirs = branches.find((x) => x.name === options.theirsBranchName);

    if (!ours) throw new Error(`Branch '${options.oursBranchName}' not found.`);
    if (!theirs) throw new Error(`Branch '${options.theirsBranchName}' not found.`);

    const message =
      options.message ||
      (options.isSquash
        ? createSquashMessage(options.theirsBranchName)
        : createMergeMessage(options.theirsBranchName, options.oursBranchName));

    try {
      // NOTE: We got a merge conflict, somewhere, somehow.
      //       Issue: project.json file to added to Unmerged paths.
      //       Solution: "git add/rm <file>" aka stage files
      await addAll(this.baseDir);

      await merge(this.baseDir, options.theirsBranchName, {
        strategy: undefined,
        isSquash: options.isSquash,
        squashNoCommit: !!options.squashNoCommit,
        message,
        noFastForward: !options.allowFastForward
      });
    } catch (err) {
      console.info('there are merge conflicts that have to be resolved, so we will resolve them just after this.');
      console.info(err);
    }

    // Our custom strategy
    const tree = await mergeTree(this.baseDir, ours, theirs);
    if (tree.kind === ComputedAction.Conflicts) {
      // Run our solve strategy
      const solver = new MergeStrategy(this.baseDir, this.mergeProject);
      await solver.solveConflicts(tree);

      // Create a merge commit
      await createCommit(this.baseDir, message);
    } else if (tree.kind !== ComputedAction.Clean) {
      throw new Error('Failed to merge, ' + tree.kind);
    }
  }

  public async getConfigValue(name: string) {
    return getConfigValue(this.baseDir, name);
  }

  public async setConfigValue(name: string, value: string) {
    return setConfigValue(this.baseDir, name, value);
  }

  public getProviderForRemote(remoteUrl: string): GitProvider {
    if (!remoteUrl) {
      return 'none';
    } else if (remoteUrl.includes('noodlapp.com')) {
      return 'noodl';
    } else if (remoteUrl.includes('github.com')) {
      return 'github';
    } else {
      return 'unknown';
    }
  }

  public async setRemoteURL(remoteUrl: string) {
    const remoteName = await this.getRemoteName();

    const url = remoteUrl?.trim();

    //if there's no existing remote, add one called origin
    if (!remoteName) {
      await addRemote(this.repositoryPath, 'origin', url);
      return;
    }

    this.originUrl = url;
    this.originProvider = this.getProviderForRemote(url);
    await setRemoteURL(this.repositoryPath, remoteName, url);
  }

  public async tryHandleRebaseState() {
    const status = await this.status();
    const conflicts = status.filter((s) => s.status === 'conflicted').map((s) => s.path);

    //check if the only issue is .gitignore and handle it
    if (conflicts.length === 1 && conflicts.includes('.gitignore')) {
      //resolve it with ours, just overwrite the remote
      //note that "ours" is reversed here since we're rebasing
      await git(['checkout', '--theirs', '.gitignore'], this.repositoryPath, 'pick-our-gitignore');
      await git(['add', '.gitignore'], this.repositoryPath, 'add-gitignore');
      await git(['rebase', '--continue'], this.repositoryPath, 'continue-rebase', {
        env: {
          GIT_EDITOR: 'true' //make sure the commit message editor doesn't pop up
        }
      });
    } else {
      throw new Error('Repository is in a rebase state. Please handle manually through a git client.');
    }
  }

  public async isRebaseInProgress(): Promise<boolean> {
    try {
      //this will return the SHA of the commit that is being rebased, or throw if there's no rebase in progress
      await git(['rev-parse', '--verify', 'REBASE_HEAD'], this.repositoryPath, 'check-rebase');
      return true;
    } catch (e) {
      return false;
    }
  }
}
