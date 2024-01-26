import { ChildProcess } from 'child_process';
import { git, GitExecutionOptions } from './client';

/**
 * Retrieve the contents of a file from the repository at a given
 * reference, commit, or tree.
 *
 * Returns a promise that will produce a string Buffer instance containing
 * the contents of the file or an error if the file doesn't
 * exists in the given revision.
 *
 * @param repositoryDir - The repository directory from where to read the file
 *
 * @param commitish  - A commit SHA or some other identifier that
 *                     ultimately dereferences to a commit/tree.
 *
 * @param path       - The file path, relative to the repository
 *                     root from where to read the blob contents
 */
export async function getBlobContents(repositoryDir: string, commitish: string, path: string): Promise<string> {
  const args = ['show', `${commitish}:${path}`];
  const opts: GitExecutionOptions = {
    parseErrors: false
  };

  const { output } = await git(args, repositoryDir, 'getBlobContents', opts);
  return output;
}

export async function getBlobBinaryContents(repositoryDir: string, commitish: string, path: string): Promise<Buffer> {
  const setBinaryEncoding: (process: ChildProcess) => void = (cb) => {
    // If Node.js encounters a synchronous runtime error while spawning
    // `stdout` will be undefined and the error will be emitted asynchronously
    if (cb.stdout) {
      cb.stdout.setEncoding('binary');
    }
  };

  const args = ['show', `${commitish}:${path}`];
  const opts: GitExecutionOptions = {
    parseErrors: false,
    processCallback: setBinaryEncoding
  };

  const { output } = await git(args, repositoryDir, 'getBlobBinaryContents', opts);

  return Buffer.from(output, 'binary');
}
