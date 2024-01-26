import { GitProcess } from "dugite";
import { getDescriptionForError, IGitResult, GitError } from "../git-error";
import { isErrnoException } from "../errno-exception";
import { IGitSpawnExecutionOptions } from "dugite/build/lib/git-process";
import { IGitRunOptions, rejectLog } from "./common";

export function execute({
  name,
  path,
  args,
  enableLogging,
  options,
}: IGitRunOptions): Promise<IGitResult> {
  const spawnOptions: IGitSpawnExecutionOptions = {
    ...(options ?? {}),

    // Explicitly set TERM to 'dumb' so that if Desktop was launched
    // from a terminal or if the system environment variables
    // have TERM set Git won't consider us as a smart terminal.
    // See https://github.com/git/git/blob/a7312d1a2/editor.c#L11-L15
    env: {
      TERM: "dumb",
      ...(options ?? {}).env,
    } as Object,
  };

  return new Promise<IGitResult>(async (resolve, reject) => {
    const process = GitProcess.spawn(args, path, spawnOptions);

    // Send the stdin
    if (options?.stdin) {
      const stdinEncoding = options.stdinEncoding ?? "utf-8";
      const stdinEncoded = Buffer.from(options.stdin).toString(stdinEncoding);
      process.stdin.write(stdinEncoded);
      process.stdin.end();
    }

    //
    if (options?.processCallback) {
      options.processCallback(process);
    }

    process.on("error", (err) => {
      // If this is an exception thrown by Node.js while attempting to
      // spawn let's keep the salient details but include the name of
      // the operation.
      if (isErrnoException(err)) {
        reject(new Error(`Failed to execute ${name}: ${err.code}`));
      } else {
        // for unhandled errors raised by the process, let's surface this in the
        // promise and make the caller handle it
        reject(err);
      }
    });

    let totalStdoutLength = 0;
    let killSignalSent = false;

    const stdoutChunks = new Array<Buffer>();

    // If Node.js encounters a synchronous runtime error while spawning
    // `stdout` will be undefined and the error will be emitted asynchronously
    if (process.stdout) {
      process.stdout.on("data", (chunk: Buffer) => {
        if (enableLogging) {
          console.log(`[${name}] stdout: ${chunk.toString()}`);
        }

        if (options?.processDataCallback) {
          options?.processDataCallback(chunk);
        }

        if (
          options?.maxBuffer === undefined ||
          (options?.maxBuffer &&
            (!options.maxBuffer || totalStdoutLength < options.maxBuffer))
        ) {
          stdoutChunks.push(chunk);
          totalStdoutLength += chunk.length;
        }

        if (
          options?.maxBuffer === undefined ||
          (options?.maxBuffer &&
            totalStdoutLength >= options.maxBuffer &&
            !killSignalSent)
        ) {
          process.kill();
          killSignalSent = true;
        }
      });
    }

    const stderrChunks = new Array<Buffer>();

    // See comment above about stdout and asynchronous errors.
    if (process.stderr) {
      process.stderr.on("data", (chunk: Buffer) => {
        if (enableLogging) {
          console.log(`[${name}] stderr: ${chunk.toString()}`);
        }

        if (options?.processDataCallback) {
          options?.processDataCallback(chunk);
        }

        stderrChunks.push(chunk);
      });
    }

    process.on("close", (code, signal) => {
      const stdout = Buffer.concat(
        stdoutChunks,
        options?.maxBuffer
          ? Math.min(options?.maxBuffer, totalStdoutLength)
          : totalStdoutLength
      );

      const stderr = Buffer.concat(stderrChunks);

      // mimic the experience of GitProcess.exec for handling known codes when
      // the process terminates
      const exitCodes = options?.successExitCodes || new Set([0]);
      const acceptableExitCode = code !== null && exitCodes.has(code);

      const shouldParseErrors = !(options?.parseErrors === false);

      // Parse the error if acceptable exit code
      const gitError = shouldParseErrors
        ? acceptableExitCode
          ? GitProcess.parseError(stderr.toString()) ??
            GitProcess.parseError(stdout.toString())
          : null
        : null;

      const gitErrorDescription = gitError
        ? getDescriptionForError(gitError)
        : null;

      // Check if the error is acceptable
      const acceptableError =
        gitError && options?.expectedErrors
          ? options.expectedErrors.has(gitError)
          : false;

      // Return the result
      const result: IGitResult = {
        output: stdout.toString("utf8"),
        error: stderr.toString("utf8"),
        exitCode: code,
        gitError,
        gitErrorDescription,
        path,
      };

      if ((gitError && acceptableError) || acceptableExitCode || signal) {
        return resolve(result);
      }

      rejectLog(args, result);
      reject(new GitError(result, args));
    });
  });
}
