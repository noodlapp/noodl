import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

monaco.editor.defineTheme('dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#323232',
    'editorGutter.background': '#3b3b3b'
  }
});
