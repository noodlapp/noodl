import { git } from "./client";
import { parseChangedFiles } from "./logs";
import { CommittedFileChange } from "./models/status";

/**
 * Get the files that were changed in the given stash commit.
 *
 * This is different than `getChangedFiles` because stashes
 * have _3 parents(!!!)_
 */
export async function getStashedFiles(
  repositoryDir: string,
  stashSha: string
): Promise<ReadonlyArray<CommittedFileChange>> {
  const [trackedFiles, untrackedFiles] = await Promise.all([
    getChangedFilesWithinStash(repositoryDir, stashSha),
    getChangedFilesWithinStash(repositoryDir, `${stashSha}^3`),
  ]);

  const files = new Map<string, CommittedFileChange>();
  trackedFiles.forEach((x) => files.set(x.path, x));
  untrackedFiles.forEach((x) => files.set(x.path, x));
  return [...files.values()].sort((x, y) => x.path.localeCompare(y.path));
}

/**
 * Same thing as `getChangedFiles` but with extra handling for 128 exit code
 * (which happens if the commit's parent is not valid)
 */
async function getChangedFilesWithinStash(repositoryDir: string, sha: string) {
  // opt-in for rename detection (-M) and copies detection (-C)
  // this is equivalent to the user configuring 'diff.renames' to 'copies'
  // NOTE: order here matters - doing -M before -C means copies aren't detected
  const args = [
    "log",
    sha,
    "-C",
    "-M",
    "-m",
    "-1",
    "--no-show-signature",
    "--first-parent",
    "--name-status",
    "--format=format:",
    "-z",
    "--",
  ];
  const result = await git(args, repositoryDir, "getChangedFilesForStash", {
    // if this fails, its most likely
    // because there weren't any untracked files,
    // and that's okay!
    successExitCodes: new Set([0, 128]),
  });

  if (result.exitCode === 0 && result.output.toString().length > 0) {
    return parseChangedFiles(result.output.toString(), sha);
  }
  return [];
}
