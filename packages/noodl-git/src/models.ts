// This is the models used by Noold right now
import { ICloneProgress } from "./core/models/progress";

import { FileStatusKind } from "./core/models/status";

export type GitUserInfo = {
  name: string;
  email: string;
};

export type GitStatus = {
  status: "new" | "modified" | "deleted" | "conflicted";
  path: string;
};

export function ConvertStatusKindToGitStatus(
  x: FileStatusKind
): GitStatus["status"] {
  switch (x) {
    case FileStatusKind.New:
      return "new";
    case FileStatusKind.Modified:
      return "modified";
    case FileStatusKind.Deleted:
      return "deleted";
    case FileStatusKind.Copied:
      return "modified";
    case FileStatusKind.Renamed:
      return "modified";
    case FileStatusKind.Conflicted:
      return "conflicted";
    case FileStatusKind.Untracked:
      return "new";
  }
}

export type GitCommit = {
  sha: string;
  shortSha: string;
  message: string;
  date: Date;
  parentCount: number;
  author: {
    name: string;
    email: string;
  };

  isLocalAhead: boolean;
  isRemoteAhead: boolean;
};

export type GitBranch = {
  name: string;
  local: boolean;
  remote: boolean;
};

export type GitCloneOptions = {
  url: string;
  directory: string;
  /** Clone a single branch; this if only for testing. */
  singleBranch?: boolean;
  onProgress?: (progress: ICloneProgress) => void;
};

export class GitEmptyRepositoryError extends Error {
  constructor() {
    super("The repository you're trying to clone is empty.");
  }
}
