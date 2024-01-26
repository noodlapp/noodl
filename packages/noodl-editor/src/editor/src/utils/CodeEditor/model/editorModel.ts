import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { prettyLanguage } from '@noodl-utils/CodeEditor/mappings';
import { TypescriptModule } from '@noodl-utils/CodeEditor/typescript/helper';

export class EditorModel {
  private _editor: monaco.editor.IStandaloneCodeEditor;
  //private _prefixSuffixExtension: PrefixSuffixExtension;

  constructor(public readonly model: monaco.editor.ITextModel, public readonly modules: TypescriptModule[] = []) {}

  public attachEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    if (this._editor) throw new Error('Editor is already attached to editor model.');
    this._editor = editor;

    //    this._prefixSuffixExtension = new PrefixSuffixExtension(
    //      editor,
    //      this.model,
    //      `/** The CSS in here is directly applied to this Node. */
    ///** It's is not possible to use classes in here. */
    //[self] {
    //`,
    //      `
    //}
    //`
    //    );
  }

  public getValue(): string {
    //    if (this._prefixSuffixExtension) {
    //      return this._prefixSuffixExtension.getValue();
    //    }
    return this.model.getValue();
  }

  public getPrettyLanguageName() {
    return prettyLanguage(this.model.getLanguageId());
  }

  public dispose() {
    this.model?.dispose();
    this.modules.forEach((model) => {
      model.dispose();
    });
  }
}
