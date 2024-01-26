import { build, Platform } from 'electron-builder';
import { BuildTarget } from './build-platforms';

const config = require('../package.json').build;

function createTarget(buildTarget: BuildTarget) {
  switch (buildTarget.platform) {
    case 'darwin':
      return Platform.MAC.createTarget(undefined, buildTarget.arch as any);

    case 'win32':
      return Platform.WINDOWS.createTarget();

    case 'linux':
      return Platform.LINUX.createTarget(undefined, buildTarget.arch as any);

    default:
      const targetName = `${buildTarget.platform}-${buildTarget.arch}`;
      throw 'Unsupported platform: ' + targetName;
  }
}

export function execElectronBuilder(buildTarget: BuildTarget) {
  return build({
    targets: createTarget(buildTarget),
    config
  });
}
