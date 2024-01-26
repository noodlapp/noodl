import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Convert a Noodl plug type to Typescript Type.
 */
export function plugTypeToTSDef(type: string, isInput: boolean) {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'Date';
    case 'object':
      return isInput ? 'any' : 'unknown';
    case 'array':
      return isInput ? 'any[]' : 'unknown[]';
    case 'signal':
      return '() => void';
    default:
      return isInput ? 'any' : 'unknown';
  }
}

export class TypescriptModule {
  private _model: monaco.editor.ITextModel;
  private _extraLib: monaco.IDisposable;
  private _libs: string[] = [];

  /**
   * https://github.com/microsoft/monaco-editor/blob/main/src/language/typescript/lib/lib.index.ts
   * https://github.com/microsoft/monaco-editor/blob/main/src/language/typescript/lib/lib.ts
   * https://www.typescriptlang.org/tsconfig#lib
   */
  get libs() {
    return this._libs;
  }

  public setLib(libs: string[]) {
    this._libs = libs || [];
  }

  public setModel(model: monaco.editor.ITextModel) {
    this._model?.dispose();
    this._model = model;
  }

  public setSource(value: string) {
    this._model?.setValue(value);
  }

  public setExtraLib(model: monaco.IDisposable) {
    this._extraLib?.dispose();
    this._extraLib = model;
  }

  public dispose() {
    this._model.dispose();
    this._extraLib?.dispose();
  }
}
