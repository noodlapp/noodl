import { git } from './client';

/**
 * Delete all the untracked files.
 *
 * @param repositoryDir
 * @returns
 */
export function cleanUntrackedFiles(repositoryDir: string) {
  return git(['clean', '-f', '-d'], repositoryDir, 'cleanUntrackedFiles');
}
