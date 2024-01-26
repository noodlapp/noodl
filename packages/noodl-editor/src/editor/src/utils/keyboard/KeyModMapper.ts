import { platform, PlatformOS } from '@noodl/platform';

import { KeyMod } from './KeyCode';

class KeyModStrMap {
  private _keyModToStr: string[];
  private _strToKeyMod: { [str: string]: KeyMod };

  constructor() {
    this._keyModToStr = [];
    this._strToKeyMod = Object.create(null);
  }

  define(keyMod: KeyMod, str: string): void {
    this._keyModToStr[keyMod] = str;
    this._strToKeyMod[str.toLowerCase()] = keyMod;
  }

  keyModToStr(keyMod: KeyMod): string {
    return this._keyModToStr[keyMod];
  }

  strToKeyMod(str: string): KeyMod | undefined {
    return this._strToKeyMod[str.toLowerCase()];
  }
}

const uiMap = new KeyModStrMap();

type KeyDef = {
  windows: string;
  mac: string;
};

(function () {
  function define(keyMod: KeyMod, { windows, mac }: KeyDef): void {
    switch (platform.os) {
      case PlatformOS.MacOS:
        uiMap.define(keyMod, mac);
        break;

      default:
      case PlatformOS.Windows:
        uiMap.define(keyMod, windows);
        break;
    }
  }

  define(KeyMod.Alt, { windows: 'Alt', mac: '⌥' });
  define(KeyMod.CtrlCmd, { windows: 'Ctrl', mac: '⌘' });
  define(KeyMod.Shift, { windows: 'Shift', mac: '⇧' });
  define(KeyMod.WinCtrl, { windows: 'Win', mac: '⌘' });
})();

export namespace KeyModUtils {
  export function toString(keyMod: KeyMod): string {
    return uiMap.keyModToStr(keyMod);
  }

  export function fromString(key: string): KeyMod {
    return uiMap.strToKeyMod(key);
  }
}
