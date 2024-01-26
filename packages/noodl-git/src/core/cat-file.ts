import { git, GitExecutionOptions } from './client';

export async function getFileContents(repositoryDir: string, blobSha: string): Promise<string> {
  const args = ['cat-file', '-p', blobSha];
  const opts: GitExecutionOptions = {
    successExitCodes: new Set([0, 1]),
    spawn: false,
    processCallback: (cb) => {
      // If Node.js encounters a synchronous runtime error while spawning
      // `stdout` will be undefined and the error will be emitted asynchronously
      if (cb.stdout) {
        cb.stdout.setEncoding('binary');
      }
    }
  };

  const { output } = await git(args, repositoryDir, 'getFileContents', opts);
  return output;
}
