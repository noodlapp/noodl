/**
 * https://stackoverflow.com/a/61725416/3211243
 */
export function isElectron(): boolean {
  // Renderer process
  // @ts-ignore window
  if (
    typeof window !== "undefined" &&
    typeof window.process === "object" &&
    // @ts-ignore
    window.process.type === "renderer"
  ) {
    return true;
  }

  // Main process
  if (
    typeof process !== "undefined" &&
    typeof process.versions === "object" &&
    !!process.versions.electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  // @ts-ignore navigator
  if (
    typeof navigator === "object" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.indexOf("Electron") >= 0
  ) {
    return true;
  }

  return false;
}

export function isNode(): boolean {
  return (
    typeof process !== "undefined" &&
    process.release.name.search(/node|io.js/) !== -1
  );
}
