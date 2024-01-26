import { IPlatform } from '@noodl/platform';

import { PlatformOS } from './common';

export class PlatformWeb implements IPlatform {
  get name(): string {
    return 'Web';
  }

  get os(): PlatformOS {
    return PlatformOS.Web;
  }

  constructor(
    private readonly _version: string,
    private readonly _versionTag: string,
    private readonly _buildNumber: string
  ) {}

  getBuildNumber(): string | undefined {
    return this._buildNumber;
  }
  getFullVersion(): string {
    return this._version + '-' + this._buildNumber;
  }
  getVersion(): string {
    return this._version;
  }
  getVersionWithTag(): string {
    return this._versionTag ? `${this._version}-${this._versionTag}` : this._version;
  }

  getUserDataPath(): string {
    return '/user';
  }
  getDocumentsPath(): string {
    return '/documents';
  }
  getTempPath(): string {
    return '/tmp';
  }
  getAppPath(): string {
    return '/app';
  }

  async openExternal(url: string): Promise<void> {
    window.open(url, '_blank').focus();
  }

  async copyToClipboard(value: string): Promise<void> {
    await navigator.clipboard.writeText(value);
  }
}
