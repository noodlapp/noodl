import { git } from "./client";

/**
 * Update the ref to a new value.
 *
 * @param repositoryDir - The repository in which the ref exists.
 * @param ref        - The ref to update. Must be fully qualified
 *                     (e.g., `refs/heads/NAME`).
 * @param oldValue   - The value we expect the ref to have currently. If it
 *                     doesn't match, the update will be aborted.
 * @param newValue   - The new value for the ref.
 * @param reason     - The reflog entry.
 */
export async function updateRef(
  repositoryDir: string,
  ref: string,
  oldValue: string,
  newValue: string,
  reason: string
): Promise<void> {
  await git(
    ["update-ref", ref, newValue, oldValue, "-m", reason],
    repositoryDir,
    "updateRef"
  );
}

/**
 * Remove a ref.
 *
 * @param repositoryDir - The repository in which the ref exists.
 * @param ref        - The ref to remove. Should be fully qualified, but may also be 'HEAD'.
 * @param reason     - The reflog entry (optional). Note that this is only useful when
 *                     deleting the HEAD reference as deleting any other reference will
 *                     implicitly delete the reflog file for that reference as well.
 */
export async function deleteRef(
  repositoryDir: string,
  ref: string,
  reason?: string
) {
  const args = ["update-ref", "-d", ref];

  if (reason !== undefined) {
    args.push("-m", reason);
  }

  return await git(args, repositoryDir, "deleteRef");
}
