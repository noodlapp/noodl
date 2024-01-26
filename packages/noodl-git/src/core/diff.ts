import {
  WorkingDirectoryFileChange,
  FileChange,
  FileStatusKind,
} from "./models/status";
import { IUnrenderableDiff, DiffType, IDiff } from "./models/diff";
import { git } from "./client";
import { getCaptures } from "./helpers/regex";

type LineEnding = "CR" | "LF" | "CRLF";
export type LineEndingsChange = {
  from: LineEnding;
  to: LineEnding;
};

/** Parse the line ending string into an enum value (or `null` if unknown) */
export function parseLineEndingText(text: string): LineEnding | null {
  const input = text.trim();
  switch (input) {
    case "CR":
      return "CR";
    case "LF":
      return "LF";
    case "CRLF":
      return "CRLF";
    default:
      return null;
  }
}

/**
 * V8 has a limit on the size of string it can create (~256MB), and unless we want to
 * trigger an unhandled exception we need to do the encoding conversion by hand.
 *
 * This is a hard limit on how big a buffer can be and still be converted into
 * a string.
 */
const MaxDiffBufferSize = 70e6; // 70MB in decimal

/**
 * Utility function to check whether parsing this buffer is going to cause
 * issues at runtime.
 *
 * @param buffer A buffer of binary text from a spawned process
 */
function isValidBuffer(buffer: Buffer) {
  return buffer.length <= MaxDiffBufferSize;
}

function buildDiff(
  buffer: Buffer,
  repositoryDir: string,
  file: FileChange,
  commitish: string,
  lineEndingsChange?: LineEndingsChange
): Promise<IDiff> {
  if (!isValidBuffer(buffer)) {
    // the buffer's diff is too large to be renderable in the UI
    return Promise.resolve<IUnrenderableDiff>({ kind: DiffType.Unrenderable });
  }

  return null;
}

/**
 * Render the difference between a file in the given commit and its parent
 *
 * @param commitish A commit SHA or some other identifier that ultimately dereferences
 *                  to a commit.
 */
export async function getCommitDiff(
  repositoryDir: string,
  file: FileChange,
  commitish: string,
  hideWhitespaceInDiff: boolean = false
): Promise<IDiff> {
  const args = [
    "log",
    commitish,
    ...(hideWhitespaceInDiff ? ["-w"] : []),
    "-m",
    "-1",
    "--first-parent",
    "--patch-with-raw",
    "-z",
    "--no-color",
    "--",
    file.path,
  ];

  if (
    file.status.kind === FileStatusKind.Renamed ||
    file.status.kind === FileStatusKind.Copied
  ) {
    args.push(file.status.oldPath);
  }

  const { output } = await git(args, repositoryDir, "getCommitDiff");

  return buildDiff(Buffer.from(output), repositoryDir, file, commitish);
}

/**
 * Render the diff for a file within the repository working directory. The file will be
 * compared against HEAD if it's tracked, if not it'll be compared to an empty file meaning
 * that all content in the file will be treated as additions.
 */
export async function getWorkingDirectoryDiff(
  repositoryDir: string,
  file: WorkingDirectoryFileChange,
  hideWhitespaceInDiff: boolean = false
): Promise<IDiff> {
  // `--no-ext-diff` should be provided wherever we invoke `git diff` so that any
  // diff.external program configured by the user is ignored
  const args = [
    "diff",
    ...(hideWhitespaceInDiff ? ["-w"] : []),
    "--no-ext-diff",
    "--patch-with-raw",
    "-z",
    "--no-color",
  ];
  const successExitCodes = new Set([0]);

  if (
    file.status.kind === FileStatusKind.New ||
    file.status.kind === FileStatusKind.Untracked
  ) {
    // `git diff --no-index` seems to emulate the exit codes from `diff` irrespective of
    // whether you set --exit-code
    //
    // this is the behavior:
    // - 0 if no changes found
    // - 1 if changes found
    // -   and error otherwise
    //
    // citation in source:
    // https://github.com/git/git/blob/1f66975deb8402131fbf7c14330d0c7cdebaeaa2/diff-no-index.c#L300
    successExitCodes.add(1);
    args.push("--no-index", "--", "/dev/null", file.path);
  } else if (file.status.kind === FileStatusKind.Renamed) {
    // NB: Technically this is incorrect, the best kind of incorrect.
    // In order to show exactly what will end up in the commit we should
    // perform a diff between the new file and the old file as it appears
    // in HEAD. By diffing against the index we won't show any changes
    // already staged to the renamed file which differs from our other diffs.
    // The closest I got to that was running hash-object and then using
    // git diff <blob> <blob> but that seems a bit excessive.
    args.push("--", file.path);
  } else {
    args.push("HEAD", "--", file.path);
  }

  const { output, error } = await git(
    args,
    repositoryDir,
    "getWorkingDirectoryDiff",
    { successExitCodes }
  );
  const lineEndingsChange = parseLineEndingsWarning(error);

  return buildDiff(
    Buffer.from(output),
    repositoryDir,
    file,
    "HEAD",
    lineEndingsChange
  );
}

/**
 * `git diff` will write out messages about the line ending changes it knows
 * about to `stderr` - this rule here will catch this and also the to/from
 * changes based on what the user has configured.
 */
const lineEndingsChangeRegex =
  /warning: (CRLF|CR|LF) will be replaced by (CRLF|CR|LF) in .*/;

/**
 * Utility function for inspecting the stderr output for the line endings
 * warning that Git may report.
 *
 * @param error A buffer of binary text from a spawned process
 */
function parseLineEndingsWarning(error: string): LineEndingsChange | undefined {
  if (error.length === 0) {
    return undefined;
  }

  const match = lineEndingsChangeRegex.exec(error);
  if (match) {
    const from = parseLineEndingText(match[1]);
    const to = parseLineEndingText(match[2]);
    if (from && to) {
      return { from, to };
    }
  }

  return undefined;
}

/**
 * List the modified binary files' paths in the given repository
 *
 * @param repository to run git operation in
 * @param ref ref (sha, branch, etc) to compare the working index against
 *
 * if you're mid-merge pass `'MERGE_HEAD'` to ref to get a diff of `HEAD` vs `MERGE_HEAD`,
 * otherwise you should probably pass `'HEAD'` to get a diff of the working tree vs `HEAD`
 */
export async function getBinaryPaths(
  repositoryDir: string,
  ref: string
): Promise<ReadonlyArray<string>> {
  const { output } = await git(
    ["diff", "--numstat", "-z", ref],
    repositoryDir,
    "getBinaryPaths"
  );
  const captures = getCaptures(output, binaryListRegex);
  if (captures.length === 0) {
    return [];
  }
  // flatten the list (only does one level deep)
  const flatCaptures = captures.reduce((acc, val) => acc.concat(val));
  return flatCaptures;
}

const binaryListRegex = /-\t-\t(?:\0.+\0)?([^\0]*)/gi;
