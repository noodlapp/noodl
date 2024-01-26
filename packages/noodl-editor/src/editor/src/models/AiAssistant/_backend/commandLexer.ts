export class ReActCommand {
  constructor(public type: string, public args: string[]) {}
}

export class ReActCommandLexer {
  private _position = 0;
  private _commands: ReActCommand[] = [];
  private _buffer = '';

  public get commands(): readonly ReActCommand[] {
    return this._commands;
  }

  private peek(input: string): string {
    if (this._position < input.length) {
      return input[this._position];
    }
    return '';
  }

  private next(input: string): string {
    const ch = input[this._position];
    this._position++;
    return ch;
  }

  private readUntil(input: string, stopChars: string[]): string {
    let value = '';
    let escaped = false;
    while (this._position < input.length) {
      const ch = this.peek(input);
      if (ch === '\n') {
        value += ch;
        this.next(input);
      } else if (stopChars.includes(ch) && !escaped) {
        break;
      } else if (ch === '\\' && !escaped) {
        escaped = true;
        this.next(input);
      } else {
        escaped = false;
        value += this.next(input);
      }
    }
    return value.trim();
  }

  public append(ch: string): ReActCommand[] {
    this._buffer += ch;
    const commandCount = this.commands.length;
    this.tokenize(this._buffer);
    // TODO: Check if any of the command content changed
    if (this.commands.length > commandCount) {
      return this.commands.slice(commandCount - 1);
    }
    return [];
  }

  public tokenize(input: string): ReActCommand[] {
    this._position = 0;
    this._commands = [];

    while (this._position < input.length) {
      const uppercaseRegex = /[A-Z]/;
      while (this._position < input.length && !uppercaseRegex.test(this.peek(input))) {
        this.next(input);
      }

      const value = this.readUntil(input, ['[']);
      const commandType = value.trim();

      const args: string[] = [];
      if (this.peek(input) === '[') {
        this.next(input);
      }

      while (this.peek(input) !== ']') {
        if (this._position >= input.length) {
          break;
        }

        if (this.peek(input) === '"') {
          this.next(input);
          const arg = this.readUntil(input, ['"']);
          args.push(arg);
          this.next(input);
        } else {
          this.next(input);
        }
      }

      if (this.peek(input) === ']') {
        this.next(input);
        if (commandType !== '' && /^[A-Z]/.test(commandType)) {
          this._commands.push(new ReActCommand(commandType, args));
        }
      } else {
        if (this._commands.length > 0) {
          const lastCommand = this._commands[this._commands.length - 1];
          lastCommand.type = commandType;
          lastCommand.args = args;
        }
      }
    }

    return this._commands;
  }
}
