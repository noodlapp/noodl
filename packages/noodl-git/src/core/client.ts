import { ChildProcess } from 'child_process';
import { GitError as DugiteError } from 'dugite';
import { IGitSpawnExecutionOptions } from 'dugite/build/lib/git-process';

import { getGitPath } from '../paths';
import * as ClientExec from './client/client-exec';
import * as ClientSpawn from './client/client-spawn';
import { IGitRunOptions } from './client/common';
import { IGitResult } from './git-error';
import { withTrampolineEnv } from './trampoline/trampoline-environment';

/**
 * Return an array of command line arguments for network operation that override
 * the default git configuration values provided by local, global, or system
 * level git configs.
 *
 * These arguments should be inserted before the subcommand, i.e in
 * the case of `git pull` these arguments needs to go before the `pull`
 * argument.
 *
 * This should be used on the commands where we want to use
 * the trampoline server.
 *
 * @param repository the local repository associated with the command, to check
 *                   local, global and system config for an existing value.
 *                   If `null` if provided (for example, when cloning a new
 *                   repository), this function will check global and system
 *                   config for an existing `protocol.version` setting
 */
export async function gitNetworkArguments(_repositoryDir: string | null): Promise<ReadonlyArray<string>> {
  const baseArgs = [
    // Explicitly unset any defined credential helper, we rely on our
    // own askpass for authentication.
    '-c',
    'credential.helper='
  ];

  return baseArgs;
}

export interface GitExecutionOptions extends IGitSpawnExecutionOptions {
  /**
   * The exit codes which indicate success to the
   * caller. Unexpected exit codes will be logged and an
   * error thrown. Defaults to 0 if undefined.
   */
  readonly successExitCodes?: ReadonlySet<number>;

  /**
   * The git errors which are expected by the caller. Unexpected errors will
   * be logged and an error thrown.
   */
  readonly expectedErrors?: ReadonlySet<DugiteError>;

  /**
   * An optional string or buffer which will be written to
   * the child process stdin stream immediately immediately
   * after spawning the process.
   */
  readonly stdin?: string | Buffer;

  /**
   * The encoding to use when writing to stdin, if the stdin
   * parameter is a string.
   */
  readonly stdinEncoding?: BufferEncoding;

  /**
   * While this is true; it will spawn the process instead which
   * results in that we can handle more of the output from the
   * process.
   * Otherwise the data will be cut off.
   *
   * Default: true
   */
  readonly spawn?: boolean;

  /**
   * The size the output buffer to allocate to the spawned process. Set this
   * if you are anticipating a large amount of output.
   *
   * If not specified, this will be 10MB (10485760 bytes) which should be
   * enough for most Git operations.
   */
  readonly maxBuffer?: number;

  /**
   * Should the process output be checked for errors?
   * Can be very slow when there's lost of output
   *
   * If not specified, this defaults to true
   */
  readonly parseErrors?: boolean;

  /**
   * An optional callback which will be invoked with the child
   * process instance after spawning the git process.
   *
   * Note that if the stdin parameter was specified the stdin
   * stream will be closed by the time this callback fires.
   */
  readonly processCallback?: (process: ChildProcess) => void;

  readonly processDataCallback?: (chunk: Buffer) => void;
}

/**
 * Shell out to git with the given arguments, at the given path.
 *
 * @param args             The arguments to pass to `git`.
 *
 * @param path             The working directory path for the execution of the
 *                         command.
 *
 * @param name             The name for the command based on its caller's
 *                         context. This will be used for performance
 *                         measurements and debugging.
 *
 * @param options          Configuration options for the execution of git,
 *                         see GitExecutionOptions for more information.
 *
 * Returns the result. If the command exits with a code not in
 * `successExitCodes` or an error not in `expectedErrors`, a `GitError` will be
 * thrown.
 */
export async function git(
  args: string[],
  path: string,
  name: string,
  options?: GitExecutionOptions
): Promise<IGitResult> {
  return withTrampolineEnv(async (env) => {
    const enableLogging = !!localStorage.getItem('git-output');
    const enableTraceLogging = !!localStorage.getItem('git-trace');

    if (enableLogging) {
      console.groupCollapsed(`[${name}] git ${args.join(' ')}`);
      console.log('path', path);
      console.log('args', args);
      console.log('options', options);
      console.groupEnd();
    }

    if (!process.env.LOCAL_GIT_DIRECTORY) {
      process.env.LOCAL_GIT_DIRECTORY = getGitPath();
    }

    const runOptions: IGitRunOptions = {
      name,
      path,
      args,
      enableLogging,
      options: {
        ...(options || {}),
        env: {
          // Add the input envs
          ...(options?.env || {}),

          // Add the trampoline env
          ...env,

          // Add extra envs
          GIT_TERMINAL_PROMPT: '0',
          GIT_TRACE: enableTraceLogging ? '1' : '0'
        }
      }
    };

    if (options?.spawn) {
      return await ClientSpawn.execute(runOptions);
    }

    return await ClientExec.execute(runOptions);
  });
}
