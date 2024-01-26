import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export function registerExtraActions(editor: monaco.editor.IStandaloneCodeEditor) {
  editor.addAction({
    id: 'table-flip',
    label: 'Table flip',
    run(ed) {
      ed.trigger('keyboard', 'type', {
        text: '(╯°□°）╯︵ ┻━┻'
      });
    }
  });

  editor.addAction({
    id: 'table-unflip',
    label: 'Table unflip',
    run(ed) {
      ed.trigger('keyboard', 'type', {
        text: '┬─┬ ノ( ゜-゜ノ)'
      });
    }
  });

  editor.addAction({
    id: 'shrug',
    label: 'Shrug',
    run(ed) {
      ed.trigger('keyboard', 'type', {
        text: '¯\\\\_(ツ)_/¯'
      });
    }
  });
}
