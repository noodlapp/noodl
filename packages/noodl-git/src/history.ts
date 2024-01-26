import { getCommits } from './core/logs';
import { Branch } from './core/models/branch';
import { revRange } from './core/rev-list';

export function getLocalCommits(
  repositoryDir: string,
  branch: Branch | null,
  revisionRange: string | null,
  limit: number
) {
  const args = ['--not', '--remotes'];
  const range = revisionRange ?? (branch?.upstream ? revRange(branch.upstream, branch.name) : 'HEAD');

  return getCommits(repositoryDir, range, limit, undefined, args);
}

export function getRemoteCommits(
  repositoryDir: string,
  branch: Branch | null,
  revisionRange: string | null,
  limit: number
) {
  const args = ['--remotes'];
  const range = revisionRange ?? (branch?.upstream ? revRange(branch.upstream, branch.name) : 'HEAD');

  return getCommits(repositoryDir, range, limit, undefined, args);
}
