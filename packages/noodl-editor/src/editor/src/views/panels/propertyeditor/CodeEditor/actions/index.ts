import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { registerExtraActions } from './extra';
import { registerThemeActions, getTheme } from './theme';

export { getTheme };

export function registerActions(editor: monaco.editor.IStandaloneCodeEditor) {
  registerThemeActions(editor);
  registerExtraActions(editor);
}
