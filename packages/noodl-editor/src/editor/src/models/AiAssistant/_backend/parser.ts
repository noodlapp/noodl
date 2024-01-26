import { Lexer, Token, TokenTypes } from './lexer';

export type CallbackFunction = (tagName: string, text: string) => void;
export type TagCallbackFunction = (tagName: string, fullText: string) => void;
export type TagOpenCallbackFunction = (tagName: string, attributes: Record<string, string>) => void;

export class Parser extends Lexer {
  private openTagStack: Token[] = [];
  private lastTextToken: Token | null = null;
  private callback: CallbackFunction;
  private openTagCallback: TagOpenCallbackFunction;
  private closeTagCallback: TagCallbackFunction;

  constructor(
    callback: CallbackFunction,
    openTagCallback: TagOpenCallbackFunction,
    closeTagCallback: TagCallbackFunction
  ) {
    super();
    this.callback = callback;
    this.openTagCallback = openTagCallback;
    this.closeTagCallback = closeTagCallback;
  }

  public append(input: string): Token[] {
    const newTokens = super.append(input);

    for (const token of newTokens) {
      if (token.type === TokenTypes.OPEN_TAG) {
        this.openTagStack.push(token);
        this.openTagCallback(token.value, token.attributes);
      } else if (token.type === TokenTypes.CLOSE_TAG) {
        const openTagIndex = this.openTagStack.findIndex((t) => t.value === token.value);
        if (openTagIndex !== -1) {
          this.openTagStack.splice(openTagIndex, 1);
          const lastToken = this.getLastToken();
          if (lastToken && lastToken.type === TokenTypes.TEXT && this.openTagStack.length === 0) {
            this.callback(token.value, lastToken.value);
          }
          this.closeTagCallback(token.value, this.lastTextToken?.value || '');
        }
      } else if (token.type === TokenTypes.SELF_CLOSING_TAG) {
        this.openTagCallback(token.value, token.attributes);
        this.closeTagCallback(token.value, '');
      } else if (token.type === TokenTypes.TEXT) {
        this.lastTextToken = token;
        if (this.openTagStack.length > 0) {
          const currentOpenTag = this.openTagStack[this.openTagStack.length - 1];
          if (currentOpenTag.type === TokenTypes.OPEN_TAG) {
            this.callback(currentOpenTag.value, token.value);
          }
        }
      }
    }

    return newTokens;
  }

  public getCurrentOpenTag(): Token | null {
    if (this.openTagStack.length > 0) {
      return this.openTagStack[this.openTagStack.length - 1];
    }
    return null;
  }

  public getLastTextToken(): Token | null {
    return this.lastTextToken;
  }
}
