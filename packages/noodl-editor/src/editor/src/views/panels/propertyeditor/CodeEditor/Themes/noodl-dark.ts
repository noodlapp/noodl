import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

monaco.editor.defineTheme('noodl-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    {
      token: 'comment',
      fontStyle: 'italic',
      foreground: '#8b877f'
    },
    {
      token: 'constant.character',
      foreground: '#eaeaea'
    },
    {
      token: 'string',
      foreground: '#f7c967'
    },
    {
      token: 'number',
      foreground: '#77C9D4'
    },
    {
      token: 'constant.numeric',
      foreground: '#eaeaea'
    },
    {
      token: 'delimiter',
      foreground: '#b6b5bf'
    },
    {
      token: 'keyword',
      foreground: '#bcaffb'
    },
    {
      token: 'type.identifier',
      foreground: '#f7c967'
    },
    {
      token: 'string.css',
      foreground: '#f7c967'
    },
    {
      token: 'tag.css',
      foreground: '#bcaffb'
    },
    {
      token: 'attribute.name.css',
      foreground: '#eaeaea'
    },
    {
      token: 'attribute.value.css',
      foreground: '#f7c967'
    },
    {
      token: 'attribute.value.number.css',
      foreground: '#f7c967'
    },
    {
      token: 'attribute.value.unit.css',
      foreground: '#f7c967'
    }
  ],
  colors: {
    'editor.background': '#323232',
    'editorGutter.background': '#3b3b3b',
    'editor.selectionBackground': '#1b1607',
    'editor.selectionHighlightBackground': '#9B86F940', //'#8070af',
    'editor.foreground': '#eaeaea',
    'editor.wordHighlightStrongBackground': '#9B86F940',
    'editor.wordHighlightStrongBorder': '#795EF799'
  }
});
