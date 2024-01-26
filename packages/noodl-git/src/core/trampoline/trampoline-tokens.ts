// TODO: Move to platform package
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}

const trampolineTokens = new Set<string>();

/** Checks if a given trampoline token is valid. */
export function isValidTrampolineToken(token: string) {
  return trampolineTokens.has(token);
}

/**
 * Allows invoking a function with a short-lived trampoline token that will be
 * revoked right after the function finishes.
 *
 * @param fn Function to invoke with the trampoline token.
 */
export async function withTrampolineToken<T>(
  fn: (token: string) => Promise<T>
): Promise<T> {
  let result: T;

  // Create a unique token for this request
  const token = guid();
  trampolineTokens.add(token);

  try {
    result = await fn(token);
  } finally {
    trampolineTokens.delete(token);
  }

  return result;
}
