import { GitError as DugiteError } from "dugite";
import { git } from "./client";
import { GitError } from "./git-error";
import {
  Stash,
  StashedChangesLoadStates,
  StashedFileChanges,
} from "./models/snapshot";
import { Branch } from "./models/branch";
import { CommitIdentity } from "./models/commit-identity";
import { GitActionError, GitActionErrorCode } from "../actions";

/**
 * RegEx for determining if a stash entry is created by Desktop
 *
 * This is done by looking for a magic string with the following
 * formats:
 * `On branchname: some message`
 * `WIP on branchname: some message` (git default when message is omitted)
 */
const desktopStashEntryMessageRe = /on (.+):/i;

type StashResult = {
  /** The stash entries created by Desktop */
  readonly entries: ReadonlyArray<Stash>;

  /**
   * The total amount of stash entries,
   * i.e. stash entries created both by Desktop and outside of Desktop
   */
  readonly stashEntryCount: number;
};

/**
 * Get the list of stash entries created by Desktop in the current repository
 * using the default ordering of refs (which is LIFO ordering),
 * as well as the total amount of stash entries.
 */
export async function getStashes(repositoryDir: string): Promise<StashResult> {
  const delimiter = "1F";
  const delimiterString = String.fromCharCode(parseInt(delimiter, 16));
  const format = ["%gD", "%H", "%gs", "%an <%ae> %at +0000"].join(
    `%x${delimiter}`
  );

  const result = await git(
    ["log", "-g", "-z", `--pretty=${format}`, "refs/stash"],
    repositoryDir,
    "getStashEntries",
    {
      successExitCodes: new Set([0, 128]),
    }
  );

  // There's no refs/stashes reflog in the repository or it's not
  // even a repository. In either case we don't care
  if (result.exitCode === 128) {
    return { entries: [], stashEntryCount: 0 };
  }

  const desktopStashEntries: Array<Stash> = [];
  const files: StashedFileChanges = {
    kind: StashedChangesLoadStates.NotLoaded,
  };

  const entries = result.output
    .toString()
    .split("\0")
    .filter((s) => s !== "");
  for (const entry of entries) {
    const pieces = entry.split(delimiterString);
    if (pieces.length === 4) {
      const [name, stashSha, message, identity] = pieces;
      const branchName = extractBranchFromMessage(message);

      // Example: 'On main: !!Noodl<main>'
      const marker = message.split(":")[1].trim();

      if (branchName !== null) {
        desktopStashEntries.push(
          new Stash(
            repositoryDir,
            name,
            branchName,
            stashSha,
            marker,
            CommitIdentity.parseIdentity(identity),
            files
          )
        );
      }
    }
  }

  return {
    entries: desktopStashEntries,
    stashEntryCount: entries.length - 1,
  };
}

/**
 * Returns the last Desktop created stash entry for the given branch
 */
export async function getLastStashEntryForBranch(
  repositoryDir: string,
  branch: Branch | string
) {
  const stash = await getStashes(repositoryDir);
  const branchName = typeof branch === "string" ? branch : branch.name;

  // Since stash objects are returned in a LIFO manner, the first
  // entry found is guaranteed to be the last entry created
  return stash.entries.find((stash) => stash.branchName === branchName) || null;
}

/**
 * Stash the working directory changes for the current branch
 */
export async function createStashEntry(
  repositoryDir: string,
  message: string
): Promise<Stash> {
  const args = ["stash", "push", "-u", "-m", message];
  const result = await git(args, repositoryDir, "createStashEntry", {
    successExitCodes: new Set<number>([0, 1]),
  });

  if (result.exitCode === 1) {
    // search for any line starting with `error:` -  /m here to ensure this is
    // applied to each line, without needing to split the text
    const errorPrefixRe = /^error: /m;

    const matches = errorPrefixRe.exec(result.error.toString());
    if (matches !== null && matches.length > 0) {
      // rethrow, because these messages should prevent the stash from being created
      throw new GitError(result, args);
    }

    // if no error messages were emitted by Git, we should log but continue because
    // a valid stash was created and this should not interfere with the checkout

    console.info(
      `[createStashEntry] a stash was created successfully but exit code ${
        result.exitCode
      } reported. stderr: ${result.error.toString()}`
    );
  }

  const response = result.output.toString();

  // Stash doesn't consider it an error that there aren't any local changes to save.
  if (response === "No local changes to save\n") {
    throw new GitActionError(GitActionErrorCode.StashNoLocalChanges);
  }

  // Fetch all the stashes and return the one we just created.
  const stashes = await getStashes(repositoryDir);
  return stashes.entries.find((x) => x.message === message);
}

/**
 * Removes the given stash entry if it exists
 *
 * @param marker
 */
export async function dropStashEntry(repositoryDir: string, marker: string) {
  if (marker !== null) {
    const args = ["stash", "drop", marker];
    await git(args, repositoryDir, "dropStashEntry");
  }
}

/**
 * Pops the stash entry identified by matching `stashSha` to its commit hash.
 *
 * To see the commit hash of stash entry, run
 * `git log -g refs/stash --pretty="%nentry: %gd%nsubject: %gs%nhash: %H%n"`
 * in a repo with some stash entries.
 */
export async function popStashEntry(
  repositoryDir: string,
  marker: string
): Promise<void> {
  // ignoring these git errors for now, this will change when we start
  // implementing the stash conflict flow
  const expectedErrors = new Set<DugiteError>([DugiteError.MergeConflicts]);
  const successExitCodes = new Set<number>([0, 1]);

  if (marker === null) {
    return;
  }

  const args = ["stash", "pop", "--quiet", `${marker}`];
  const result = await git(args, repositoryDir, "popStashEntry", {
    expectedErrors,
    successExitCodes,
    spawn: false,
  });

  // popping a stashes that create conflicts in the working directory
  // report an exit code of `1` and are not dropped after being applied.
  // so, we check for this case and drop them manually
  if (result.exitCode === 1) {
    if (result.error.toString().length > 0) {
      // rethrow, because anything in stderr should prevent the stash from being popped
      throw new GitError(result, args);
    }

    console.info(
      `[popStashEntry] a stash was popped successfully but exit code ${result.exitCode} reported.`
    );
    // bye bye
    await dropStashEntry(repositoryDir, marker);
  }
}

export async function popStashEntryToBranch(
  repositoryDir: string,
  marker: string,
  branchName: string
) {
  // ignoring these git errors for now, this will change when we start
  // implementing the stash conflict flow
  const expectedErrors = new Set<DugiteError>([DugiteError.MergeConflicts]);
  const successExitCodes = new Set<number>([0, 1]);

  const args = ["stash", "branch", branchName, `${marker}`];
  const result = await git(args, repositoryDir, "popStashEntryToBranch", {
    expectedErrors,
    successExitCodes,
    spawn: false,
  });

  if (result.exitCode === 1) {
    throw new GitError(result, args);
  }
}

function extractBranchFromMessage(message: string): string | null {
  const match = desktopStashEntryMessageRe.exec(message);
  return match === null || match[1].length === 0 ? null : match[1];
}
