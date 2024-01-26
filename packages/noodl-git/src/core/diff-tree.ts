import { git } from "./client";
import { AppFileStatus, FileChange, FileStatusKind } from "./models/status";

/**
 *
 * $ git show --format="" --name-status -z --no-color c0bfb14
 *
 * @param repositoryDir
 * @param commitish
 */
export async function getCommitFiles(
  repositoryDir: string,
  commitish: string
): Promise<readonly FileChange[]> {
  const args = [
    "show",
    "--format=oneline",
    "--name-status",
    "-z",
    "--no-color",
    commitish,
  ];

  const { output } = await git(args, repositoryDir, "getCommitFiles");
  const segments = output
    .toString()
    .split("\u0000")
    .filter((s) => s.length > 0);

  const result: FileChange[] = [];

  // Possible status letters are:
  //
  // A: addition of a file
  // C: copy of a file into a new one
  // D: deletion of a file
  // M: modification of the contents or mode of a file
  // R: renaming of a file
  // T: change in the type of the file (regular file, symbolic link or submodule)
  // U: file is unmerged (you must complete the merge before it can be committed)
  // X: "unknown" change type (most probably a bug, please report it)
  //
  // TODO: Add support for C, T, U codes
  //
  for (let index = 1; index < segments.length; ) {
    const modifier = segments[index];
    if (/^[a-z0-9]{40}/.test(modifier)) {
      index += 1;
    } else {
      const filePath = segments[index + 1];

      if (modifier.startsWith("A")) {
        result.push(
          new FileChange(filePath, {
            kind: FileStatusKind.New,
          })
        );
      } else if (modifier.startsWith("M")) {
        result.push(
          new FileChange(filePath, {
            kind: FileStatusKind.Modified,
          })
        );
      } else if (modifier.startsWith("D")) {
        result.push(
          new FileChange(filePath, {
            kind: FileStatusKind.Deleted,
          })
        );
      } else if (modifier.startsWith("R")) {
        const newFilePath = segments[index + 1];
        result.push(
          new FileChange(newFilePath, {
            kind: FileStatusKind.Renamed,
            oldPath: filePath,
          })
        );
        index += 1;
      }

      index += 2;
    }
  }

  //Rev ranges might have duplicates, so naively just dedupe based on the path
  return [...new Map(result.map((r) => [r.path, r])).values()];
}
