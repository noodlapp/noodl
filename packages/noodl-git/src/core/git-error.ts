import { GitError as DugiteError } from "dugite";

/**
 * Returns the SHA of the passed in IGitResult
 */
export function parseCommitSHA(result: IGitResult): string {
  return result.output.toString().split("]")[0].split(" ")[1];
}

/**
 * The result of using `git`.
 */
export interface IGitResult {
  /** The contents of stdout received from the spawned process */
  readonly output: string;

  /** The contents of stderr received from the spawned process */
  readonly error: string;

  /** The exit code returned by the spawned process */
  readonly exitCode: number | null;

  /**
   * The parsed git error. This will be null when the exit code is included in
   * the `successExitCodes`, or when dugite was unable to parse the
   * error.
   */
  readonly gitError: DugiteError | null;

  /** The human-readable error description, based on `gitError`. */
  readonly gitErrorDescription: string | null;

  /**
   * The path that the Git command was executed from, i.e. the
   * process working directory (not to be confused with the Git
   * working directory which is... super confusing, I know)
   */
  readonly path: string;
}

export class GitError extends Error {
  /** The result from the failed command. */
  public readonly result: IGitResult;

  /** The args for the failed command. */
  public readonly args: ReadonlyArray<string>;

  /**
   * Whether or not the error message is just the raw output of the git command.
   */
  public readonly isRawMessage: boolean;

  public constructor(result: IGitResult, args: ReadonlyArray<string>) {
    let rawMessage = true;
    let message: string;

    if (result.gitErrorDescription) {
      message = result.gitErrorDescription;
      rawMessage = false;
    } else if (result.error.length) {
      message = result.error.toString();
    } else if (result.output.length) {
      message = result.error.toString();
    } else {
      message = "Unknown error";
      rawMessage = false;
    }

    super(message);

    this.name = "GitError";
    this.result = result;
    this.args = args;
    this.isRawMessage = rawMessage;
  }
}

/**
 * Determine whether the provided `error` is an authentication failure
 * as per our definition. Note that this is not an exhaustive list of
 * authentication failures, only a collection of errors that we treat
 * equally in terms of error message and presentation to the user.
 */
export function isAuthFailureError(
  error: DugiteError
): error is
  | DugiteError.SSHAuthenticationFailed
  | DugiteError.SSHPermissionDenied
  | DugiteError.HTTPSAuthenticationFailed {
  switch (error) {
    case DugiteError.SSHAuthenticationFailed:
    case DugiteError.SSHPermissionDenied:
    case DugiteError.HTTPSAuthenticationFailed:
      return true;
  }
  return false;
}

export function getDescriptionForError(error: DugiteError): string | null {
  if (isAuthFailureError(error)) {
    return `Authentication failed. Some common reasons include:
  
  - You are not logged in to your account
  - You may need to log out and log back in to refresh your token.
  - You do not have permission to access this repository.
  - The repository is archived on GitHub. Check the repository settings to confirm you are still permitted to push commits.
  - If you use SSH authentication, check that your key is added to the ssh-agent and associated with your account.
  - If you use SSH authentication, ensure the host key verification passes for your repository hosting service.
  - If you used username / password authentication, you might need to use a Personal Access Token instead of your account password. Check the documentation of your repository hosting service.`;
  }

  switch (error) {
    case DugiteError.SSHKeyAuditUnverified:
      return "The SSH key is unverified.";
    case DugiteError.RemoteDisconnection:
      return "The remote disconnected. Check your Internet connection and try again.";
    case DugiteError.HostDown:
      return "The host is down. Check your Internet connection and try again.";
    case DugiteError.RebaseConflicts:
      return "We found some conflicts while trying to rebase. Please resolve the conflicts before continuing.";
    case DugiteError.MergeConflicts:
      return "We found some conflicts while trying to merge. Please resolve the conflicts and commit the changes.";
    case DugiteError.HTTPSRepositoryNotFound:
    case DugiteError.SSHRepositoryNotFound:
      return "The repository does not seem to exist anymore. You may not have access, or it may have been deleted or renamed.";
    case DugiteError.PushNotFastForward:
      return "The repository has been updated since you last pulled. Try pulling before pushing.";
    case DugiteError.BranchDeletionFailed:
      return "Could not delete the branch. It was probably already deleted.";
    case DugiteError.DefaultBranchDeletionFailed:
      return `The branch is the repository's default branch and cannot be deleted.`;
    case DugiteError.RevertConflicts:
      return "To finish reverting, please merge and commit the changes.";
    case DugiteError.EmptyRebasePatch:
      return "There aren’t any changes left to apply.";
    case DugiteError.NoMatchingRemoteBranch:
      return "There aren’t any remote branches that match the current branch.";
    case DugiteError.NothingToCommit:
      return "There are no changes to commit.";
    case DugiteError.NoSubmoduleMapping:
      return "A submodule was removed from .gitmodules, but the folder still exists in the repository. Delete the folder, commit the change, then try again.";
    case DugiteError.SubmoduleRepositoryDoesNotExist:
      return "A submodule points to a location which does not exist.";
    case DugiteError.InvalidSubmoduleSHA:
      return "A submodule points to a commit which does not exist.";
    case DugiteError.LocalPermissionDenied:
      return "Permission denied.";
    case DugiteError.InvalidMerge:
      return "This is not something we can merge.";
    case DugiteError.InvalidRebase:
      return "This is not something we can rebase.";
    case DugiteError.NonFastForwardMergeIntoEmptyHead:
      return "The merge you attempted is not a fast-forward, so it cannot be performed on an empty branch.";
    case DugiteError.PatchDoesNotApply:
      return "The requested changes conflict with one or more files in the repository.";
    case DugiteError.BranchAlreadyExists:
      return "A branch with that name already exists.";
    case DugiteError.BadRevision:
      return "Bad revision.";
    case DugiteError.NotAGitRepository:
      return "This is not a git repository.";
    case DugiteError.ProtectedBranchForcePush:
      return "This branch is protected from force-push operations.";
    case DugiteError.ProtectedBranchRequiresReview:
      return "This branch is protected and any changes requires an approved review. Open a pull request with changes targeting this branch instead.";
    case DugiteError.PushWithFileSizeExceedingLimit:
      return "The push operation includes a file which exceeds GitHub's file size restriction of 100MB. Please remove the file from history and try again.";
    case DugiteError.HexBranchNameRejected:
      return "The branch name cannot be a 40-character string of hexadecimal characters, as this is the format that Git uses for representing objects.";
    case DugiteError.ForcePushRejected:
      return "The force push has been rejected for the current branch.";
    case DugiteError.InvalidRefLength:
      return "A ref cannot be longer than 255 characters.";
    case DugiteError.CannotMergeUnrelatedHistories:
      return "Unable to merge unrelated histories in this repository.";
    case DugiteError.PushWithPrivateEmail:
      return 'Cannot push these commits as they contain an email address marked as private on GitHub. To push anyway, visit https://github.com/settings/emails, uncheck "Keep my email address private", then switch back to GitHub Desktop to push your commits. You can then enable the setting again.';
    case DugiteError.LFSAttributeDoesNotMatch:
      return "Git LFS attribute found in global Git configuration does not match expected value.";
    case DugiteError.ProtectedBranchDeleteRejected:
      return "This branch cannot be deleted from the remote repository because it is marked as protected.";
    case DugiteError.ProtectedBranchRequiredStatus:
      return "The push was rejected by the remote server because a required status check has not been satisfied.";
    case DugiteError.BranchRenameFailed:
      return "The branch could not be renamed.";
    case DugiteError.PathDoesNotExist:
      return "The path does not exist on disk.";
    case DugiteError.InvalidObjectName:
      return "The object was not found in the Git repository.";
    case DugiteError.OutsideRepository:
      return "This path is not a valid path inside the repository.";
    case DugiteError.LockFileAlreadyExists:
      return "A lock file already exists in the repository, which blocks this operation from completing.";
    case DugiteError.NoMergeToAbort:
      return "There is no merge in progress, so there is nothing to abort.";
    case DugiteError.NoExistingRemoteBranch:
      return "The remote branch does not exist.";
    case DugiteError.LocalChangesOverwritten:
      return "Unable to switch branches as there are working directory changes which would be overwritten. Please commit or stash your changes.";
    case DugiteError.UnresolvedConflicts:
      return "There are unresolved conflicts in the working directory.";
    case DugiteError.ConfigLockFileAlreadyExists:
      // Added in dugite 1.88.0 (https://github.com/desktop/dugite/pull/386)
      // in support of https://github.com/desktop/desktop/issues/8675 but we're
      // not using it yet. Returning a null message here means the stderr will
      // be used as the error message (or stdout if stderr is empty), i.e. the
      // same behavior as before the ConfigLockFileAlreadyExists was added
      return null;
    case DugiteError.RemoteAlreadyExists:
      return null;
    case DugiteError.TagAlreadyExists:
      return "A tag with that name already exists";
    case DugiteError.MergeWithLocalChanges:
    case DugiteError.RebaseWithLocalChanges:
    case DugiteError.GPGFailedToSignData:
    case DugiteError.ConflictModifyDeletedInBranch:
    case DugiteError.MergeCommitNoMainlineOption:
      return null;
    default:
      throw new Error(`Unknown error: ${error}`);
  }
}
