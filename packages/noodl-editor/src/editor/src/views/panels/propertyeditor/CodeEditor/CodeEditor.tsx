import { useDragHandler } from '@noodl-hooks/useDragHandler';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';

import getDocsEndpoint from '@noodl-utils/getDocsEndpoint';

import { ToolbarButton } from '@noodl-core-ui/components/toolbar/ToolbarButton';
import { ToolbarGrip } from '@noodl-core-ui/components/toolbar/ToolbarGrip';

import './CodeEditor.css';
import { registerActions, getTheme } from './actions';
import './Themes/dark';
import './Themes/noodl-dark';
import { EditorModel } from '@noodl-utils/CodeEditor/model/editorModel';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';

import { IVector2 } from '../../../nodegrapheditor';

export interface CodeEditorProps {
  nodeId: string;
  model: EditorModel;
  initialSize?: IVector2;

  onSave: () => void;
  outEditor?: (editor: monaco.editor.ICodeEditor) => void;
}

export function CodeEditor({ model, initialSize, onSave, outEditor }: CodeEditorProps) {
  const rootRef = useRef<HTMLDivElement>();
  const editorRef = useRef<HTMLDivElement>();
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: initialSize?.x ?? 700,
    height: initialSize?.y ?? 500
  });

  const [language, setLanguage] = useState<string>('');
  const [cursorPos, setCursorPos] = useState<string>('Ln 1, Col 1');

  const { startDrag } = useDragHandler({
    root: rootRef,
    minHeight: 120,
    minWidth: 120,
    onDrag(contentWidth, contentHeight) {
      setSize({
        width: contentWidth,
        height: contentHeight
      });
    },
    onEndDrag() {
      editor?.focus();
    }
  });

  useLayoutEffect(() => {
    const newEditor = monaco.editor.create(editorRef.current, {
      model: model.model,
      language: model.model.getLanguageId(),
      theme: getTheme(),
      glyphMargin: false,
      folding: false,
      autoDetectHighContrast: false,
      minimap: { enabled: false },
      suggest: {
        localityBonus: true,
        preview: true,
        showMethods: true,
        showFunctions: true,
        showConstructors: false,
        showDeprecated: false,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: false,
        showFiles: false,
        showUsers: true,
        showSnippets: true
      },
      quickSuggestions: true,
      inlineSuggest: {
        enabled: false
      },
      wordWrap: model.model.getLanguageId() === 'plaintext' ? 'on' : 'off',
      // lightbulb: {
      //   enabled: true
      // },
      accessibilityHelpUrl: getDocsEndpoint()
    });

    registerActions(newEditor);

    // Solve the issue where it scrolls to line 2
    let firstLayoutChange = true;
    newEditor.onDidLayoutChange(() => {
      if (!firstLayoutChange) return;
      firstLayoutChange = false;
      newEditor.setSelection(new monaco.Selection(0, 0, 0, 0));
      editorRef.current.scrollTop = 0;
    });

    // Add a save command,
    // this is not important when we have auto-save,
    // but important when we dont have it.
    newEditor.addAction({
      id: 'save',
      label: 'Save',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run() {
        onSave && onSave();
      }
    });

    newEditor.onDidChangeCursorSelection((e) => {
      const selectedCharacters = newEditor.getModel().getCharacterCountInRange(e.selection);
      const selectedText =
        selectedCharacters > 0
          ? `Ln ${e.selection.startLineNumber}, Col ${e.selection.startColumn} (${selectedCharacters} selected)`
          : `Ln ${e.selection.startLineNumber}, Col ${e.selection.startColumn}`;

      setCursorPos(selectedText);
    });

    // NOTE(auto-saving): Uncomment to enable auto saving
    // newEditor.onDidChangeModelContent((_evt) => onSave());

    model.attachEditor(newEditor);

    setLanguage(model.getPrettyLanguageName());
    setEditor(newEditor);

    outEditor && outEditor(newEditor);
  }, [editorRef]);

  useEffect(() => {
    if (!editor) return;
    editor.layout({
      width: editorRef.current.offsetWidth,
      height: editorRef.current.offsetHeight
    });
  }, [editor, size]);

  const gutterSize = '48px';

  let testRunCodeLabel = 'TEST CODE';

  // When not a scripting language change the button label.
  if (['javascript', 'typescript'].includes(language.toLowerCase())) {
    testRunCodeLabel = 'TEST RUN CODE';
  }

  return (
    <div
      ref={rootRef}
      style={{
        width: size.width,
        height: size.height,
        minWidth: 200,
        minHeight: 200,
        display: 'grid',
        gridTemplateRows: '24px auto 24px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#3b3b3b' }}></div>
      <div ref={editorRef} style={{ overflow: 'hidden' }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#3b3b3b' }}>
        <div style={{ display: 'flex', paddingLeft: gutterSize, alignItems: 'center' }}>
          <ToolbarButton
            prefix={<Icon icon={IconName.Play} size={IconSize.Small} UNSAFE_style={{ paddingRight: '8px' }} />}
            label={testRunCodeLabel}
            onClick={() => {
              onSave && onSave();
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ToolbarButton label={cursorPos} />
          <ToolbarButton label={language} />
          <ToolbarGrip onMouseDown={startDrag} />
        </div>
      </div>
    </div>
  );
}
