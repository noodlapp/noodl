import { git } from "./client";
import { parseCommitSHA } from "./git-error";

/** Grouping of information required to create a commit */
interface ICommitContext {
  /**
   * The summary of the commit message (required)
   */
  readonly summary: string;
  /**
   * Additional details for the commit message (optional)
   */
  readonly description: string | null;
  /**
   * Whether or not it should amend the last commit (optional, default: false)
   */
  readonly amend?: boolean;
}

/**
 * @param repositoryDir repository directory
 * @param message commit message
 * @param amend amend the commit
 * @returns the commit long SHA
 */
export async function createCommit(
  repositoryDir: string,
  message: string,
  amend: boolean = false
): Promise<string> {
  const args = ["-F", "-", "--allow-empty-message"];

  if (amend) {
    args.push("--amend");
  }

  // Create the commit
  const result = await git(["commit", ...args], repositoryDir, "createCommit", {
    stdin: message,
    spawn: false,
  });

  // Parse the result where we want to get the short SHA
  const shortSha = parseCommitSHA(result);

  // Try to get the long sha
  // Problem here is that we might get something like "(root-commit)"
  // in shortSha where we actually expect a short sha.
  //
  // This will occur on the first commit in the repository.
  try {
    // Retrieve the long sha since it's more reliable.
    const longShaResult = await git(
      ["rev-parse", shortSha],
      repositoryDir,
      "createCommit"
    );

    const longSha = longShaResult.output.toString().trim();
    return longSha;
  } catch (_e) {}

  // If the previous call failed then we probably don't care about getting the
  // long sha anyways. To feel better we should probably check this properly and
  // actually return the correct value always.
  return null;
}
