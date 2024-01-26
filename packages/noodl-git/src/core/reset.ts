import { git } from "./client";

/** The reset modes which are supported. */
export const enum GitResetMode {
  /**
   * Resets the index and working tree. Any changes to tracked files in the
   * working tree since <commit> are discarded.
   */
  Hard = 0,
  /**
   * Does not touch the index file or the working tree at all (but resets the
   * head to <commit>, just like all modes do). This leaves all your changed
   * files "Changes to be committed", as git status would put it.
   */
  Soft,

  /**
   * Resets the index but not the working tree (i.e., the changed files are
   * preserved but not marked for commit) and reports what has not been updated.
   * This is the default action for git reset.
   */
  Mixed,
}

function resetModeToArgs(mode: GitResetMode, ref: string): string[] {
  switch (mode) {
    case GitResetMode.Hard:
      return ["reset", "--hard", ref];
    case GitResetMode.Mixed:
      return ["reset", ref];
    case GitResetMode.Soft:
      return ["reset", "--soft", ref];
    default:
      throw new Error(`Unknown reset mode: ${mode}`);
  }
}

/** Reset with the mode to the ref. */
export async function reset(
  repositoryDir: string,
  mode: GitResetMode,
  ref: string,
  additionalArgs: string[] = []
): Promise<true> {
  const args = resetModeToArgs(mode, ref).concat(additionalArgs);
  await git(args, repositoryDir, "reset");
  return true;
}
