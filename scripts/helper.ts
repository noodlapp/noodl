export function valueToBoolean(value: unknown): boolean | undefined {
  if (typeof value === "string") {
    return value === "true" || value === "1";
  }
  return undefined;
}

/**
 * Environment variables are only strings
 *
 * GitHub Actions will send 'true' and 'false'
 */
export function isTrueToString(value: unknown): "true" | undefined {
  const result = valueToBoolean(value);
  return result === true ? "true" : undefined;
}
export function isFalseToString(value: unknown): "true" | undefined {
  const result = valueToBoolean(value);
  return result === false ? "true" : undefined;
}

export function getCurrentPlatform() {
  // return 'darwin-arm64';
  return `${process.platform}-${process.arch}`;
}
