export enum GitActionErrorCode {
  LocalRepository,
  InvalidBranchName,
  BranchNotExisting,
  StashNoLocalChanges,
  AuthorizationFailed
}

/**
 * GitActionError will be thrown from the action functions,
 * which are designed to be a higher level of interaction
 * with git than the other functions.
 */
export class GitActionError extends Error {
  public constructor(public readonly code: GitActionErrorCode) {
    super(getMessage(code));
  }
}

function getMessage(code: GitActionErrorCode): string {
  switch (code) {
    case GitActionErrorCode.LocalRepository:
      return 'Repository is not published.';

    case GitActionErrorCode.InvalidBranchName:
      return 'Branch name contains invalid characters.';

    case GitActionErrorCode.BranchNotExisting:
      return 'Branch does not exist.';

    case GitActionErrorCode.StashNoLocalChanges:
      return 'No local changes to save.';

    case GitActionErrorCode.AuthorizationFailed:
      return 'Authorization failed.';

    default:
      return String(code);
  }
}

export function createErrorFromMessage(message: string) {
  if (message.includes('Authentication failed')) {
    return new GitActionError(GitActionErrorCode.AuthorizationFailed);
  } else {
    return new Error(message);
  }
}
