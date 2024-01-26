import { GitProcess } from "dugite";
import { getDescriptionForError, IGitResult, GitError } from "../git-error";
import { IGitRunOptions, rejectLog } from "./common";

export function execute({
  name,
  path,
  args,
  enableLogging,
  options,
}: IGitRunOptions): Promise<IGitResult> {
  return new Promise<IGitResult>(async (resolve, reject) => {
    const gitResult = await GitProcess.exec(args, path, {
      env: options.env,
      stdin: options?.stdin,
      stdinEncoding: options?.stdinEncoding,
      processCallback: options?.processCallback,
    });

    const exitCodes = options?.successExitCodes || new Set([0]);
    const acceptableExitCode =
      gitResult.exitCode !== null && exitCodes.has(gitResult.exitCode);

    const shouldParseErrors = !(options?.parseErrors === false);

    // Parse the error if acceptable exit code
    const gitError = shouldParseErrors
      ? acceptableExitCode
        ? GitProcess.parseError(gitResult.stderr) ??
          GitProcess.parseError(gitResult.stdout)
        : null
      : null;

    const gitErrorDescription = gitError
      ? getDescriptionForError(gitError)
      : null;

    // Return the result
    const result: IGitResult = {
      output: gitResult.stdout,
      error: gitResult.stderr,
      exitCode: gitResult.exitCode,
      gitError,
      gitErrorDescription,
      path,
    };

    if (enableLogging) {
      console.log(`[${name}] stdout: ${result.output.toString()}`);
      console.log(`[${name}] stderr: ${result.error.toString()}`);
    }

    // Check if the error is acceptable
    const acceptableError =
      gitError && options?.expectedErrors
        ? options.expectedErrors.has(gitError)
        : false;

    if ((gitError && acceptableError) || acceptableExitCode) {
      return resolve(result);
    }

    rejectLog(args, result);
    reject(new GitError(result, args));
  });
}
