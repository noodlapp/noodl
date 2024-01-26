import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export function getTheme() {
  return localStorage.getItem('monaco-theme') || 'noodl-dark';
}

function setTheme(theme: string) {
  localStorage.setItem('monaco-theme', theme);
  monaco.editor.setTheme(theme);
}

export function registerThemeActions(editor: monaco.editor.IStandaloneCodeEditor) {
  editor.addAction({
    id: 'set-theme-noodl-dark',
    label: 'Set theme to Noodl dark',
    run(_ed) {
      setTheme('noodl-dark');
    }
  });

  editor.addAction({
    id: 'set-theme-dark',
    label: 'Set theme to default dark',
    run(_ed) {
      setTheme('dark');
    }
  });
}
