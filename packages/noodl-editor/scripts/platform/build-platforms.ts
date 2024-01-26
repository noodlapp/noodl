import { ArchType } from 'builder-util';

export interface BuildTarget {
  platform: NodeJS.Platform;
  arch: ArchType;
}

export function isGitHubActions() {
  return process.env.GITHUB_ACTIONS === 'true';
}

export function getDistArchitecture(): 'arm64' | 'x64' {
  // If a specific npm_config_arch is set, we use that one instead of the OS arch (to support cross compilation)
  if (process.env.npm_config_arch === 'arm64' || process.env.npm_config_arch === 'x64') {
    return process.env.npm_config_arch;
  }

  if (process.arch === 'arm64') {
    return 'arm64';
  }

  // TODO: Check if it's x64 running on an arm64 Windows with IsWow64Process2
  // More info: https://www.rudyhuyn.com/blog/2017/12/13/how-to-detect-that-your-x86-application-runs-on-windows-on-arm/
  // Right now (March 3, 2021) is not very important because support for x64
  // apps on an arm64 Windows is experimental. See:
  // https://blogs.windows.com/windows-insider/2020/12/10/introducing-x64-emulation-in-preview-for-windows-10-on-arm-pcs-to-the-windows-insider-program/

  return 'x64';
}

export function getDistPlatform(targetPlatform: string): 'win' | 'linux' | 'mac' {
  if (targetPlatform === 'win32') {
    return 'win';
  }

  if (targetPlatform === 'linux') {
    return 'linux';
  }

  if (targetPlatform === 'darwin') {
    return 'mac';
  }

  throw new Error(`Unsupported platform: ${targetPlatform}`);
}
