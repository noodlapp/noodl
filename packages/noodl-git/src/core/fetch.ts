import { git, GitExecutionOptions, gitNetworkArguments } from "./client";
import { IFetchProgress } from "./models/progress";
import { FetchProgressParser, executionOptionsWithProgress } from "./progress";
import { IRemote } from "./models/remote";
import { ITrackingBranch } from "./models/branch";
import { IGitResult } from "./git-error";

async function getFetchArgs(
  repositoryDir: string,
  remote: string,
  progressCallback?: (progress: IFetchProgress) => void
) {
  const networkArguments = await gitNetworkArguments(repositoryDir);

  return progressCallback != null
    ? [...networkArguments, "fetch", "--progress", "--prune", remote]
    : [...networkArguments, "fetch", "--prune", remote];
}

/**
 * Fetch from the given remote.
 *
 * @param repository - The repository to fetch into
 *
 * @param remote     - The remote to fetch from
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the fetch operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git fetch'.
 */
export async function fetch(
  repositoryDir: string,
  remote: IRemote,
  progressCallback?: (progress: IFetchProgress) => void
): Promise<IGitResult> {
  let opts: GitExecutionOptions = {
    successExitCodes: new Set([0]),
  };

  if (progressCallback) {
    const title = `Fetching ${remote.name}`;
    const kind = "fetch";

    opts = await executionOptionsWithProgress(
      { ...opts },
      new FetchProgressParser(),
      (progress) => {
        // In addition to progress output from the remote end and from
        // git itself, the stderr output from pull contains information
        // about ref updates. We don't need to bring those into the progress
        // stream so we'll just punt on anything we don't know about for now.
        if (progress.kind === "context") {
          if (!progress.text.startsWith("remote: Counting objects")) {
            return;
          }
        }

        const description =
          progress.kind === "progress" ? progress.details.text : progress.text;
        const value = progress.percent;

        progressCallback({
          kind,
          title,
          description,
          value,
          remote: remote.name,
        });
      }
    );
  }

  const args = await getFetchArgs(repositoryDir, remote.name, progressCallback);
  return await git(args, repositoryDir, "fetch", opts);
}

/** Fetch a given refspec from the given remote. */
export async function fetchRefspec(
  repositoryDir: string,
  remote: IRemote,
  refspec: string
): Promise<void> {
  const options = {
    successExitCodes: new Set([0, 128]),
    env: {},
  };

  const networkArguments = await gitNetworkArguments(repositoryDir);

  const args = [...networkArguments, "fetch", remote.name, refspec];

  await git(args, repositoryDir, "fetchRefspec", options);
}

export async function fastForwardBranches(
  repositoryDir: string,
  branches: ReadonlyArray<ITrackingBranch>
): Promise<void> {
  if (branches.length === 0) {
    return;
  }

  const refPairs = branches.map(
    (branch) => `${branch.upstreamRef}:${branch.ref}`
  );

  const opts: GitExecutionOptions = {
    // Fetch exits with an exit code of 1 if one or more refs failed to update
    // which is what we expect will happen
    successExitCodes: new Set([0, 1]),
    env: {
      // This will make sure the reflog entries are correct after
      // fast-forwarding the branches.
      GIT_REFLOG_ACTION: "pull",
    },
    stdin: refPairs.join("\n"),
  };

  await git(
    [
      "fetch",
      ".",
      // Make sure we don't try to update branches that can't be fast-forwarded
      // even if the user disabled this via the git config option
      // `fetch.showForcedUpdates`
      "--show-forced-updates",
      // Prevent `git fetch` from touching the `FETCH_HEAD`
      "--no-write-fetch-head",
      // Take branch refs from stdin to circumvent shell max line length
      // limitations (mainly on Windows)
      "--stdin",
    ],
    repositoryDir,
    "fastForwardBranches",
    opts
  );
}
