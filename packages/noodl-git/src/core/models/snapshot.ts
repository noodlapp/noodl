import { getCommitFiles } from "../diff-tree";
import { getBlobContents } from "../show";
import { getStashedFiles } from "../stash-files";
import { CommitIdentity } from "./commit-identity";
import { FileChange } from "./status";
import { CommittedFileChange } from "./status";

/** A snapshot entry can either be a Commit or a Stash */
export interface SnapshotEntry {
  /** The shapshot SHA. */
  readonly sha: string;
  /**
   * Information about the author of this commit.
   * Includes name, email and date.
   */
  readonly author: CommitIdentity;

  getFileAsString(name: string): Promise<string>;
  getFiles(): Promise<readonly FileChange[]>;
}

/**
 * A minimal shape of data to represent a commit, for situations where the
 * application does not require the full commit metadata.
 *
 * Equivalent to the output where Git command support the
 * `--oneline --no-abbrev-commit` arguments to format a commit.
 */
export type CommitOneLine = {
  /** The full commit id associated with the commit */
  readonly sha: string;
  /** The first line of the commit message */
  readonly summary: string;
};

/** A git commit. */
export class Commit implements SnapshotEntry {
  /**
   * A value indicating whether the author and the committer
   * are the same person.
   */
  public readonly authoredByCommitter: boolean;

  /**
   * Whether or not the commit is a merge commit (i.e. has at least 2 parents)
   */
  public readonly isMergeCommit: boolean;

  /**
   * @param sha The commit's SHA.
   * @param shortSha The commit's shortSHA.
   * @param summary The first line of the commit message.
   * @param body The commit message without the first line and CR.
   * @param author Information about the author of this commit.
   *               Includes name, email and date.
   * @param committer Information about the committer of this commit.
   *                  Includes name, email and date.
   * @param parentSHAs The SHAs for the parents of the commit.
   * @param tags Tags associated with this commit.
   */
  public constructor(
    public readonly repositoryDir: string,
    public readonly sha: string,
    public readonly shortSha: string,
    public readonly summary: string,
    public readonly body: string,
    public readonly author: CommitIdentity,
    public readonly committer: CommitIdentity,
    public readonly parentSHAs: ReadonlyArray<string>,
    public readonly tags: ReadonlyArray<string>
  ) {
    this.authoredByCommitter =
      this.author &&
      this.author.name === this.committer.name &&
      this.author.email === this.committer.email;

    this.isMergeCommit = parentSHAs.length > 1;
  }

  public async getFileAsString(name: string): Promise<string> {
    return await getBlobContents(this.repositoryDir, this.sha, name);
  }

  public getFiles(): Promise<readonly FileChange[]> {
    return getCommitFiles(this.repositoryDir, this.sha);
  }
}

export class Stash implements SnapshotEntry {
  /**
   *
   * @param repositoryDir
   * @param name The fully qualified name of the entry i.e., `refs/stash@{0}`
   * @param sha The SHA of the commit object created as a result of stashing.
   * @param branchName The name of the branch at the time the entry was created.
   * @param message
   * @param author
   * @param files The list of files this stash touches
   */
  public constructor(
    public readonly repositoryDir: string,
    public readonly name: string,
    public readonly branchName: string,
    public readonly sha: string,
    public readonly message: string,
    public readonly author: CommitIdentity,
    public readonly files: StashedFileChanges
  ) {}

  public async getFileAsString(name: string): Promise<string> {
    return await getBlobContents(this.repositoryDir, this.sha, name);
  }

  public getFiles(): Promise<readonly FileChange[]> {
    return getStashedFiles(this.repositoryDir, this.sha);
  }
}

/** Whether file changes for a stash entry are loaded or not */
export enum StashedChangesLoadStates {
  NotLoaded = "NotLoaded",
  Loading = "Loading",
  Loaded = "Loaded",
}

/**
 * The status of stashed file changes
 *
 * When the status us `Loaded` all the files associated
 * with the stash are made available.
 */
export type StashedFileChanges =
  | {
      readonly kind:
        | StashedChangesLoadStates.NotLoaded
        | StashedChangesLoadStates.Loading;
    }
  | {
      readonly kind: StashedChangesLoadStates.Loaded;
      readonly files: ReadonlyArray<CommittedFileChange>;
    };
