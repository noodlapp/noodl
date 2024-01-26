/** A remote as defined in Git. */
export interface IRemote {
  readonly name: string;
  readonly url: string;
}

/** A remote as defined in Git. */
export interface IRemote {
  readonly name: string;
  readonly url: string;
}

/**
 * Gets a value indicating whether two remotes can be considered
 * structurally equivalent to each other.
 */
export function remoteEquals(x: IRemote | null, y: IRemote | null) {
  if (x === y) {
    return true;
  }

  if (x === null || y === null) {
    return false;
  }

  return x.name === y.name && x.url === y.url;
}
