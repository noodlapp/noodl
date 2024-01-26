import fs from 'fs';
import path from 'path';
import open from 'open';
import { addTrailingSlash, IPlatform, PlatformOS } from '@noodl/platform';

import { processPlatformToPlatformOS } from './helper';

function getAppPath() {
  if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    return process.cwd();
  }

  if (fs.existsSync(path.join(__dirname, 'package.json'))) {
    return __dirname;
  }

  throw `[@noodl/platform] Cannot find package.json, to get the build version. (${__dirname})`;
}

export class PlatformNode implements IPlatform {
  get name(): string {
    return 'Node';
  }

  get os(): PlatformOS {
    return this._os;
  }

  private _os: PlatformOS;
  private _userDataPath: string;
  private _tempPath: string;
  private _appPath: string;
  private _buildNumber: string;
  private _version: string;
  private _versionTag: string;
  private _versionId: string;

  constructor() {
    const os = require('os');
    const roamingPath =
      process.env.APPDATA ||
      (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');

    this._userDataPath = path.join(roamingPath, 'Noodl');
    this._tempPath = addTrailingSlash(os.tmpdir());
    this._appPath = addTrailingSlash(getAppPath());

    const packagePath = path.join(this._appPath, 'package.json');
    // Double check, just to be sure
    if (!fs.existsSync(packagePath)) {
      throw `[@noodl/platform] Cannot find package.json, to get the build version. ('${packagePath}')`;
    }

    const packageJson = fs.readFileSync(packagePath, 'utf8');
    const packageContent = JSON.parse(packageJson);
    this._buildNumber = packageContent.buildNumber || 1;
    this._version = packageContent.version;
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
    throw new Error('Method not supported.');
  }
  getTempPath(): string {
    return this._tempPath;
  }
  getAppPath(): string {
    return this._appPath;
  }

  async openExternal(url: string): Promise<void> {
    await open(url);
  }

  copyToClipboard(value: string): Promise<void> {
    // I really don't want to install more "dependencies" when I don't think
    // they will be used...
    //
    // https://github.com/sindresorhus/clipboardy
    throw new Error('Method not implemented.');
  }
}
