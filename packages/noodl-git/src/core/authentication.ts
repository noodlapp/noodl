import { GitError as DugiteError } from 'dugite';

/** The set of errors which fit under the "authentication failed" umbrella. */
export const AuthenticationErrors: ReadonlySet<DugiteError> = new Set([
  DugiteError.HTTPSAuthenticationFailed,
  DugiteError.SSHAuthenticationFailed,
  DugiteError.HTTPSRepositoryNotFound,
  DugiteError.SSHRepositoryNotFound
]);
