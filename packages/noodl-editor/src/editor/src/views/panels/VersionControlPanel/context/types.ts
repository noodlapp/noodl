import { Git } from '@noodl/git';
import { Branch } from '@noodl/git/src/core/models/branch';
import { Stash } from '@noodl/git/src/core/models/snapshot';
import { WorkingDirectoryFileChange, WorkingDirectoryStatus } from '@noodl/git/src/core/models/status';

import { ProjectLocalDiff } from './DiffUtils';

export type GitStatus =
  | {
      kind: 'default';
    }
  | {
      kind: 'error';
      message: string;
    }
  | {
      kind: 'error-fetch';
      message: string;
    }
  | {
      kind: 'fetch';
      progress?: number;
    }
  | {
      kind: 'pull';
      progress?: number;
      message?: string;
    }
  | {
      kind: 'push';
      progress?: number;
      message?: string;
    }
  | {
      kind: 'push-repository';
    }
  | {
      kind: 'set-authorization';
    };

export type BranchStatus = {
  kind: 'default' | 'merge';
  to: Branch; //TODO: this should only exist when kind is merge
};

export interface IVersionControlContextFetch {
  /** Returns the current git status. */
  gitStatus: GitStatus;
  setGitStatus: (value: GitStatus) => void;

  /** Returns the current branch. */
  currentBranch: Branch;
  currentCommitSha: string;
  remoteCommitSha: string;

  /** Returns the last fetch time. */
  lastFetchTime: number | undefined;

  workingDirectoryStatus: WorkingDirectoryStatus;
  branches: readonly Branch[];
  stashes: readonly Stash[];

  localCommitCount: number | undefined;
  remoteCommitCount: number | undefined;

  fetchLocal: () => Promise<void>;
  fetchRemote: () => Promise<void>;
  createStashMessage: () => string;
}

export interface IVersionControlContext {
  git: Git;
  repositoryPath: string;

  activeTabId: string;
  setActiveTabId: (value: string) => void;

  selectedCommit: string;
  setSelectedCommit: (value: string) => void;

  isPerformingAction: boolean;
  setIsPerformingAction: (value: boolean) => void;

  /** Returns the current branch status. */
  branchStatus: BranchStatus;
  setBranchStatus: (value: BranchStatus) => void;

  updateLocalDiff: () => void;
  localDiff: ProjectLocalDiff;
  localFiles: WorkingDirectoryFileChange[];
  localChangesCount: number;

  fetch: IVersionControlContextFetch;
}
