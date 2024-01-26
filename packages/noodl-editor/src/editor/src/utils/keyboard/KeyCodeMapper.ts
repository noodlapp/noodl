import { KeyCode } from './KeyCode';

class KeyCodeStrMap {
  private _keyCodeToStr: string[];
  private _strToKeyCode: { [str: string]: KeyCode };

  constructor() {
    this._keyCodeToStr = [];
    this._strToKeyCode = Object.create(null);
  }

  define(keyCode: KeyCode, str: string): void {
    this._keyCodeToStr[keyCode] = str;
    this._strToKeyCode[str.toLowerCase()] = keyCode;
  }

  keyCodeToStr(keyCode: KeyCode): string {
    return this._keyCodeToStr[keyCode];
  }

  strToKeyCode(str: string): KeyCode {
    return this._strToKeyCode[str.toLowerCase()] || KeyCode.Unknown;
  }
}

const uiMap = new KeyCodeStrMap();

(function () {
  function define(keyCode: KeyCode, uiLabel: string): void {
    uiMap.define(keyCode, uiLabel);
  }

  define(KeyCode.Unknown, 'unknown');

  define(KeyCode.Backspace, 'Backspace');
  define(KeyCode.Tab, 'Tab');
  define(KeyCode.Enter, 'Enter');
  define(KeyCode.Shift, 'Shift');
  define(KeyCode.Ctrl, 'Ctrl');
  define(KeyCode.Alt, 'Alt');
  define(KeyCode.PauseBreak, 'PauseBreak');
  define(KeyCode.CapsLock, 'CapsLock');
  define(KeyCode.Escape, 'Escape');
  define(KeyCode.Space, 'Space');
  define(KeyCode.PageUp, 'PageUp');
  define(KeyCode.PageDown, 'PageDown');
  define(KeyCode.End, 'End');
  define(KeyCode.Home, 'Home');

  define(KeyCode.LeftArrow, 'ArrowLeft');
  define(KeyCode.UpArrow, 'ArrowUp');
  define(KeyCode.RightArrow, 'ArrowRight');
  define(KeyCode.DownArrow, 'ArrowDown');
  define(KeyCode.Insert, 'Insert');
  define(KeyCode.Delete, 'Delete');

  define(KeyCode.KEY_0, '0');
  define(KeyCode.KEY_1, '1');
  define(KeyCode.KEY_2, '2');
  define(KeyCode.KEY_3, '3');
  define(KeyCode.KEY_4, '4');
  define(KeyCode.KEY_5, '5');
  define(KeyCode.KEY_6, '6');
  define(KeyCode.KEY_7, '7');
  define(KeyCode.KEY_8, '8');
  define(KeyCode.KEY_9, '9');

  define(KeyCode.KEY_A, 'A');
  define(KeyCode.KEY_B, 'B');
  define(KeyCode.KEY_C, 'C');
  define(KeyCode.KEY_D, 'D');
  define(KeyCode.KEY_E, 'E');
  define(KeyCode.KEY_F, 'F');
  define(KeyCode.KEY_G, 'G');
  define(KeyCode.KEY_H, 'H');
  define(KeyCode.KEY_I, 'I');
  define(KeyCode.KEY_J, 'J');
  define(KeyCode.KEY_K, 'K');
  define(KeyCode.KEY_L, 'L');
  define(KeyCode.KEY_M, 'M');
  define(KeyCode.KEY_N, 'N');
  define(KeyCode.KEY_O, 'O');
  define(KeyCode.KEY_P, 'P');
  define(KeyCode.KEY_Q, 'Q');
  define(KeyCode.KEY_R, 'R');
  define(KeyCode.KEY_S, 'S');
  define(KeyCode.KEY_T, 'T');
  define(KeyCode.KEY_U, 'U');
  define(KeyCode.KEY_V, 'V');
  define(KeyCode.KEY_W, 'W');
  define(KeyCode.KEY_X, 'X');
  define(KeyCode.KEY_Y, 'Y');
  define(KeyCode.KEY_Z, 'Z');

  define(KeyCode.Meta, 'Meta');
  define(KeyCode.ContextMenu, 'ContextMenu');

  define(KeyCode.F1, 'F1');
  define(KeyCode.F2, 'F2');
  define(KeyCode.F3, 'F3');
  define(KeyCode.F4, 'F4');
  define(KeyCode.F5, 'F5');
  define(KeyCode.F6, 'F6');
  define(KeyCode.F7, 'F7');
  define(KeyCode.F8, 'F8');
  define(KeyCode.F9, 'F9');
  define(KeyCode.F10, 'F10');
  define(KeyCode.F11, 'F11');
  define(KeyCode.F12, 'F12');
  define(KeyCode.F13, 'F13');
  define(KeyCode.F14, 'F14');
  define(KeyCode.F15, 'F15');
  define(KeyCode.F16, 'F16');
  define(KeyCode.F17, 'F17');
  define(KeyCode.F18, 'F18');
  define(KeyCode.F19, 'F19');

  define(KeyCode.NumLock, 'NumLock');
  define(KeyCode.ScrollLock, 'ScrollLock');

  define(KeyCode.US_SEMICOLON, ';');
  define(KeyCode.US_EQUAL, '=');
  define(KeyCode.US_COMMA, ',');
  define(KeyCode.US_MINUS, '-');
  define(KeyCode.US_DOT, '.');
  define(KeyCode.US_SLASH, '/');
  define(KeyCode.US_BACKTICK, '`');
  define(KeyCode.ABNT_C1, 'ABNT_C1');
  define(KeyCode.ABNT_C2, 'ABNT_C2');
  define(KeyCode.US_OPEN_SQUARE_BRACKET, '[');
  define(KeyCode.US_BACKSLASH, '\\');
  define(KeyCode.US_CLOSE_SQUARE_BRACKET, ']');
  define(KeyCode.US_QUOTE, "'");
  define(KeyCode.OEM_8, 'OEM_8');
  define(KeyCode.OEM_102, 'OEM_102');

  define(KeyCode.NUMPAD_0, 'NumPad0');
  define(KeyCode.NUMPAD_1, 'NumPad1');
  define(KeyCode.NUMPAD_2, 'NumPad2');
  define(KeyCode.NUMPAD_3, 'NumPad3');
  define(KeyCode.NUMPAD_4, 'NumPad4');
  define(KeyCode.NUMPAD_5, 'NumPad5');
  define(KeyCode.NUMPAD_6, 'NumPad6');
  define(KeyCode.NUMPAD_7, 'NumPad7');
  define(KeyCode.NUMPAD_8, 'NumPad8');
  define(KeyCode.NUMPAD_9, 'NumPad9');

  define(KeyCode.NUMPAD_MULTIPLY, 'NumPad_Multiply');
  define(KeyCode.NUMPAD_ADD, 'NumPad_Add');
  define(KeyCode.NUMPAD_SEPARATOR, 'NumPad_Separator');
  define(KeyCode.NUMPAD_SUBTRACT, 'NumPad_Subtract');
  define(KeyCode.NUMPAD_DECIMAL, 'NumPad_Decimal');
  define(KeyCode.NUMPAD_DIVIDE, 'NumPad_Divide');
})();

export namespace KeyCodeUtils {
  export function toString(keyCode: KeyCode): string {
    return uiMap.keyCodeToStr(keyCode);
  }

  export function fromString(key: string): KeyCode {
    if (key === ' ') {
      return uiMap.strToKeyCode('Space');
    }
    return uiMap.strToKeyCode(key);
  }
}
