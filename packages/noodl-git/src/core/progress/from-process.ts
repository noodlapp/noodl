import { GitProgressParser, IGitProgress, IGitOutput } from './common';
import { GitExecutionOptions } from '../client';
import { merge } from '../helpers/object';

/**
 * Merges an instance of GitExecutionOptions with a process callback provided
 * by createProgressProcessCallback.
 *
 * If the given options object already has a processCallback specified it will
 * be overwritten.
 */
export async function executionOptionsWithProgress(
  options: GitExecutionOptions,
  parser: GitProgressParser,
  progressCallback: (progress: IGitProgress | IGitOutput) => void
): Promise<GitExecutionOptions> {
  let env = {};

  return merge(options, {
    spawn: true,
    /**
     * Returns a callback which can be passed along to the processCallback option
     * in IGitExecution. The callback then takes care of reading stderr of the
     * process and parsing its contents using the provided parser.
     */
    processDataCallback: (chunk: Buffer) => {
      const lines = chunk.toString().split(/[\r\n]/g);
      lines.forEach((line) => {
        if (!line) return;
        const progress = parser.parse(line);
        progressCallback(progress);
      });
    },
    // NOTE: This is we want to use spawn: false later
    //     processCallback: (process) => {
    //       console.log('pid', process.pid);
    //
    //       const callback = (line: Buffer) => {
    //         console.log(line.toString());
    //         const progress = parser.parse(line.toString());
    //         progressCallback(progress);
    //       }
    //
    //       byline(process.stdout).on("data", callback);
    //       byline(process.stderr).on("data", callback);
    //     },
    env: merge(options.env, env)
  });
}
