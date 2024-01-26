import { KeyMod, KeyCode } from './keyboard/KeyCode';
import { KeyCodeUtils } from './keyboard/KeyCodeMapper';

export interface KeyboardCommand {
  handler: () => void;
  keybinding: number; //e.g. KeyMod.CtrlCmd | KeyCode.KEY_V
  weight?: number;
  type?: 'up' | 'down'; //default is down
}

function getKeyMod(evt: KeyboardEvent): KeyMod {
  let modKey: KeyMod = 0;
  if (evt.metaKey || evt.ctrlKey) modKey |= KeyMod.CtrlCmd; // | KeyMod.WinCtrl
  if (evt.shiftKey) modKey |= KeyMod.Shift;
  if (evt.altKey) modKey |= KeyMod.Alt;
  return modKey;
}

type KeyEventHandler = (event: KeyboardEvent) => void;
type MouseEventHandler = (event: MouseEvent) => void;

export default class KeyboardHandler {
  static instance = new KeyboardHandler();

  commands: KeyboardCommand[];

  onKeyDown: KeyEventHandler;
  onKeyUp: KeyEventHandler;
  onMouseUp: MouseEventHandler;

  constructor() {
    this.commands = [];

    this.onKeyDown = (event) => {
      if (event.repeat) {
        return;
      }

      const code = getKeyMod(event) + KeyCodeUtils.fromString(event.key);

      const focusedElements = $(':focus');

      if (code === KeyCode.Escape) {
        if (focusedElements.length > 0) {
          focusedElements[0].blur();
          return;
        }
      }

      if (focusedElements.length > 0) {
        //something else has focus, e.g. a text input or similar
        return;
      }

      this.executeCommandMatchingKeyEvent(event, 'down');
    };

    this.onKeyUp = (event) => {
      if (event.repeat) {
        return;
      }

      if ($(':focus').length > 0) return; // Only do this if no other element is currently focused

      this.executeCommandMatchingKeyEvent(event, 'up');
    };

    this.onMouseUp = (event) => {
      switch (event.button) {
        case 0:
          // Left button
          break;
        case 1:
          // Middle button
          break;
        case 2:
          // Right button
          break;
        case 3:
          // Back button
          break;
        case 4:
          // Forward button
          break;
      }
    };

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  executeCommandMatchingKeyEvent(event: KeyboardEvent, type: 'down' | 'up') {
    const code = getKeyMod(event) + KeyCodeUtils.fromString(event.key);
    const command = this.findCommand(code, type);
    command?.handler();
  }

  private findCommand(code: number, type: 'up' | 'down') {
    const matchingCommands = this.commands.filter((c) => c.keybinding === code && (c.type || 'down') === type);

    if (matchingCommands.length === 0) {
      return null;
    }

    return matchingCommands.reduce((prev, curr) => (prev.weight < curr.weight ? prev : curr));
  }

  registerCommands(commands: KeyboardCommand[]) {
    commands.forEach((c) => this.commands.push(c));
  }

  deregisterCommands(commands: KeyboardCommand[]) {
    commands.forEach((c) => this.deregisterCommand(c));
  }

  private deregisterCommand(command: KeyboardCommand) {
    const index = this.commands.indexOf(command);
    if (index !== -1) {
      this.commands.splice(index, 1);
    } else {
      console.error("KeyboardHandler: Trying to deregister a command that's not registered");
    }
  }
}
