export enum TokenTypes {
  OPEN_TAG = 'OPEN_TAG',
  CLOSE_TAG = 'CLOSE_TAG',
  SELF_CLOSING_TAG = 'SELF_CLOSING_TAG',
  TEXT = 'TEXT'
}

export class Token {
  constructor(public type: TokenTypes, public value: string, public attributes: Record<string, string> = {}) {}
}

export class Lexer {
  private _position = 0;
  private _tokens: Token[] = [];
  private _buffer = '';

  public get tokens(): readonly Token[] {
    return this._tokens;
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

  private readUntil(input: string, stopChar: string): string {
    let value = '';
    while (this._position < input.length) {
      const ch = this.peek(input);
      if (ch === stopChar) {
        break;
      }
      value += this.next(input);
    }
    return value;
  }

  private tokenizeTag(input: string): { tagName: string; attributes: Record<string, string> } {
    const parts = input.trim().split(/(?=\s\w+=)/);
    const tagName = parts.shift()?.trim() || '';
    const attributes: Record<string, string> = {};

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (value) {
        attributes[key] = value.replace(/^"(.*)"$/, '$1');
      }
    }

    return { tagName, attributes };
  }

  public tokenize(input: string): Token[] {
    const _tokens: Token[] = [];
    this._position = 0;

    while (this._position < input.length) {
      const ch = this.peek(input);

      if (ch === '<') {
        this.next(input);
        const value = this.readUntil(input, '>');

        // If there is no closing '>' for an OPEN_TAG, return an empty array and store it in the _buffer
        if (this._position >= input.length) {
          this._buffer = '<' + value;
          return [];
        }

        this.next(input);

        if (value.startsWith('/')) {
          _tokens.push(new Token(TokenTypes.CLOSE_TAG, value.slice(1)));
        } else if (value.endsWith('/')) {
          const { tagName, attributes } = this.tokenizeTag(value.slice(0, -1));
          _tokens.push(new Token(TokenTypes.SELF_CLOSING_TAG, tagName, attributes));
        } else {
          const { tagName, attributes } = this.tokenizeTag(value);
          _tokens.push(new Token(TokenTypes.OPEN_TAG, tagName, attributes));
        }
      } else {
        // handle tag values
        let value = '';
        while (this._position < input.length) {
          const nextChar = this.peek(input);
          if (nextChar === '<') {
            break;
          }
          value += this.next(input);
        }
        if (value) {
          _tokens.push(new Token(TokenTypes.TEXT, value));
        }
      }
    }

    return _tokens;
  }

  public append(input: string): Token[] {
    // If there is a _buffer, prepend it to the input and clear the _buffer
    if (this._buffer) {
      input = this._buffer + input;
      this._buffer = '';
    }

    // Tokenize the new input
    const new_tokens = this.tokenize(input);
    const updated_tokens = [];

    // If the last token is TEXT and the first new token is not an OPEN_TAG, merge them
    if (this._tokens.length > 0 && new_tokens.length > 0) {
      const lastToken = this._tokens[this._tokens.length - 1];
      const firstNewToken = new_tokens[0];

      if (
        lastToken.type === TokenTypes.TEXT &&
        ![TokenTypes.OPEN_TAG, TokenTypes.CLOSE_TAG, TokenTypes.SELF_CLOSING_TAG].includes(firstNewToken.type)
      ) {
        lastToken.value += firstNewToken.value;
        new_tokens.shift();
        updated_tokens.push(lastToken);
      }
    }

    this._tokens = this._tokens.concat(new_tokens);
    return [...new_tokens, ...updated_tokens];
  }

  public getTokenIndex() {
    return this._tokens.length - 1;
  }

  public getTextBetween(start: number, end: number) {
    return _tokensToText(this._tokens.slice(start, end));
  }

  public getLastToken(): Token | undefined {
    if (this._tokens.length > 0) {
      return this._tokens[this._tokens.length - 1];
    }
    return null;
  }

  public getFullText(): string {
    return _tokensToText(this._tokens);
  }
}

export function _tokensToText(_tokens: Token[]): string {
  return _tokens.reduce((text, token) => {
    if (token.type === TokenTypes.TEXT) {
      return text + token.value;
    } else if (token.type === TokenTypes.OPEN_TAG) {
      const attributes = Object.keys(token.attributes).map((x) => `${x}="${token.attributes[x]}"`);
      return attributes.length > 0
        ? text + '<' + token.value + ' ' + attributes.join(' ') + '>'
        : text + '<' + token.value + '>';
    } else if (token.type === TokenTypes.CLOSE_TAG) {
      return text + '</' + token.value + '>';
    } else if (token.type === TokenTypes.SELF_CLOSING_TAG) {
      const attributes = Object.keys(token.attributes).map((x) => `${x}="${token.attributes[x]}"`);
      return attributes.length > 0
        ? text + '<' + token.value + ' ' + attributes.join(' ') + ' />'
        : text + '<' + token.value + '/>';
    }
    return text;
  }, '');
}
