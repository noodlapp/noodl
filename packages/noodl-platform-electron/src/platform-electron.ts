import fs from 'fs';
import path from 'path';
import { shell, clipboard } from 'electron';
import { addTrailingSlash, IPlatform, PlatformOS } from '@noodl/platform';
import { processPlatformToPlatformOS } from '@noodl/platform-node/src/helper';

export class PlatformElectron implements IPlatform {
  get name(): string {
    return 'Electron';
  }

  get os(): PlatformOS {
    return this._os;
  }

  private _os: PlatformOS;
  private _userDataPath: string;
  private _documentsPath: string;
  private _tempPath: string;
  private _appPath: string;
  private _buildNumber: string;
  private _version: string;
  private _versionTag: string;
  private _versionId: string;

  constructor() {
    const app = require('electron').app || require('@electron/remote').app;
    this._userDataPath = app.getPath('userData');
    this._documentsPath = app.getPath('documents');
    this._tempPath = addTrailingSlash(app.getPath('temp'));
    this._appPath = addTrailingSlash(app.getAppPath());

    const packagePath = path.join(this._appPath, 'package.json');
    if (!fs.existsSync(packagePath)) {
      throw 'Cannot find package.json, to get the build version.';
    }

    const packageJson = fs.readFileSync(packagePath, 'utf8');
    const packageContent = JSON.parse(packageJson);
    this._buildNumber = packageContent.buildNumber || 1;
    this._version = require('@electron/remote').app.getVersion();
    this._versionId = packageContent.fullVersion;
    this._versionTag = packageContent.versionTag;

    this._os = processPlatformToPlatformOS();
  }

  getBuildNumber(): string | undefined {
    return this._buildNumber;
  }
  getFullVersion(): string {
    return this._versionId;
  }
  getVersion(): string {
    return this._version;
  }
  getVersionWithTag(): string {
    return this._versionTag ? `${this._version}-${this._versionTag}` : this._version;
  }

  getUserDataPath(): string {
    return this._userDataPath;
  }
  getDocumentsPath(): string {
    return this._documentsPath;
  }
  getTempPath(): string {
    return this._tempPath;
  }
  getAppPath(): string {
    return this._appPath;
  }

  openExternal(url: string): Promise<void> {
    return shell.openExternal(url);
  }

  copyToClipboard(value: string): Promise<void> {
    clipboard.writeText(value);
    return Promise.resolve();
  }
}
