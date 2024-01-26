import path from "path";
import { getDesktopTrampolinePath as desktopGetDesktopTrampolinePath } from "desktop-trampoline";

let cache_desktopTrampolinePath: string = null;

/**
 * Returns and caches the desktop trampoline path,
 * via "desktop-trampoline"'s helper method.
 *
 * @returns
 */
function getDesktopTrampolinePathHelper() {
  if (cache_desktopTrampolinePath !== null) return cache_desktopTrampolinePath;
  // getDesktopTrampolinePath takes about 5ms, caching it removes the time.
  cache_desktopTrampolinePath = desktopGetDesktopTrampolinePath();

  //this is required due to this limitation in electron: https://github.com/electron/electron/issues/8206
  //only affects production builds
  cache_desktopTrampolinePath = cache_desktopTrampolinePath.replace(
    "asar",
    "asar.unpacked"
  );

  return cache_desktopTrampolinePath;
}

/**
 * Returns the desktop trampoline path, where we expect it to be.
 *
 * @returns
 */
export function getDesktopTrampolinePath(): string {
  if (process.env.LOCAL_GIT_TRAMPOLINE_DIRECTORY) {
    return process.env.LOCAL_GIT_TRAMPOLINE_DIRECTORY;
  }

  return path
    .resolve(
      __dirname,
      "..",
      "..",
      "node_modules",
      "desktop-trampoline",
      "build",
      "Release",
      "desktop-trampoline"
    )
    .replace(/[\\\/]app.asar[\\\/]/, "/app.asar.unpacked/");
}

export function getGitPath(): string {
  // This is required because dugite is not imported as external package.
  // Where __dirname would otherwise be the package path.
  return path
    .resolve(__dirname, "..", "..", "node_modules", "dugite", "git")
    .replace(/[\\\/]app.asar[\\\/]/, "/app.asar.unpacked/");
}
