import { getCommits } from "../core/logs";
import { Branch } from "../core/models/branch";
import { Commit } from "../core/models/snapshot";
import { getAheadBehind, revSymmetricDifference } from "../core/rev-list";

export class CommitHistoryEntry extends Commit {
  public isLocalAhead: boolean;
  public isRemoteAhead: boolean;

  public constructor(
    commit: Commit,
    isLocalAhead: boolean,
    isRemoteAhead: boolean
  ) {
    super(
      commit.repositoryDir,
      commit.sha,
      commit.shortSha,
      commit.summary,
      commit.body,
      commit.author,
      commit.committer,
      commit.parentSHAs,
      commit.tags
    );

    this.isLocalAhead = isLocalAhead;
    this.isRemoteAhead = isRemoteAhead;
  }
}

/**
 * Class designed to handle history between multiple branches.
 */
export class CommitHistory {
  public constructor(
    public readonly repositoryDir: string,
    public readonly branch: Branch
  ) {}

  public async fetch(count: number): Promise<readonly CommitHistoryEntry[]> {
    const localGitCommits = await getCommits(
      this.repositoryDir,
      undefined,
      count
    );

    let commits: CommitHistoryEntry[] = localGitCommits.map(
      (x) => new CommitHistoryEntry(x, false, false)
    );

    if (this.branch.remote) {
      const remoteAheadGitCommits = await getCommits(
        this.repositoryDir,
        `${this.branch.nameWithoutRemote}..${this.branch.remote.name}`,
        count
      );

      const remoteOnlyCommits = remoteAheadGitCommits.map(
        (x) => new CommitHistoryEntry(x, false, true)
      );

      //get commits that aren't pushed
      const localAheadGitCommits = await getCommits(
        this.repositoryDir,
        `${this.branch.remote.name}..${this.branch.nameWithoutRemote}`,
        count
      );

      localAheadGitCommits.forEach((aheadCommit) => {
        const c = commits.find((c) => c.sha === aheadCommit.sha);
        if (c) {
          c.isLocalAhead = true;
        }
      });

      commits = remoteOnlyCommits.concat(commits);
    } else {
      // there is no remote, it's a local branch
      // flag all the commits as being "ahead" of
      // the remote (even the commit that was the branching points, and commits before it)
      commits.forEach((c) => (c.isLocalAhead = true));
    }

    return commits;
  }
}
