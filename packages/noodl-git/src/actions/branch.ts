import { getBranches as gitGetBranches } from "../core/for-each-ref";
import { Branch } from "../core/models/branch";
import { sortBy, groupBy } from "underscore";
import { deleteRef } from "../core/update-ref";
import { pushDelete } from "../core/push";
import { GitActionError, GitActionErrorCode } from "./git-action-error";

export async function getBranches(
  repositoryDir: string
): Promise<readonly Branch[]> {
  const branches = await gitGetBranches(repositoryDir);
  const groupped = groupBy(branches, (x) => x.type);
  Object.keys(groupped).forEach((key) => sortBy(groupped[key], (x) => x.name));
  return Object.keys(groupped).flatMap((key) => groupped[key]);
}

/**
 * Delete a local branch, this will leave the remote branch intact if there is one.
 *
 * @param repositoryDir
 * @param branch
 */
export async function deleteLocalBranch(
  repositoryDir: string,
  branch: Branch
): Promise<void> {
  await deleteRef(repositoryDir, branch.ref);
}

/**
 * Delete a remote branch.
 *
 * @param repositoryDir
 * @param branch
 */
export async function deleteRemoteBranch(
  repositoryDir: string,
  branch: Branch
): Promise<void> {
  if (!branch.upstream) {
    throw new Error("Branch is not remote.");
  }

  try {
    await pushDelete(
      repositoryDir,
      branch.upstreamRemoteName,
      branch.nameWithoutRemote
    );
  } catch (error) {
    const message = error.toString();
    if (message.includes("remote ref does not exist")) {
      throw new GitActionError(GitActionErrorCode.BranchNotExisting);
    } else {
      throw error;
    }
  }
}
