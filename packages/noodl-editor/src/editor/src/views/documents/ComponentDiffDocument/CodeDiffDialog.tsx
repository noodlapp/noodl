import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useEffect, useRef } from 'react';
import { ITextDiff } from '@noodl/git/src/core/models/diff-data';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { IconButton } from '@noodl-core-ui/components/inputs/IconButton';
import { BaseDialog, DialogBackground } from '@noodl-core-ui/components/layout/BaseDialog';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';

import { getTheme } from '../../panels/propertyeditor/CodeEditor/actions';

export interface CodeDiffDialogProps {
  diff: ITextDiff;
  onClose: () => void;
}

function anyToString(value: unknown) {
  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function CodeDiffDialog({ diff, onClose }: CodeDiffDialogProps) {
  const codeEditorRef = useRef();

  useEffect(() => {
    if (!codeEditorRef.current) {
      return;
    }

    const originalModel = monaco.editor.createModel(anyToString(diff.original), 'text/plain');
    const modifiedModel = monaco.editor.createModel(anyToString(diff.modified), 'text/plain');

    let editor: monaco.editor.IEditor;

    if (diff.original && !diff.modified) {
      editor = monaco.editor.create(codeEditorRef.current, {
        model: originalModel,
        theme: getTheme(),
        readOnly: true
      });
    } else if (!diff.original && diff.modified) {
      editor = monaco.editor.create(codeEditorRef.current, {
        model: modifiedModel,
        theme: getTheme(),
        readOnly: true
      });
    } else {
      editor = monaco.editor.createDiffEditor(codeEditorRef.current, {
        theme: getTheme()
      });
      editor.setModel({
        original: originalModel,
        modified: modifiedModel
      });
    }

    const onResize = () => editor.layout();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);

      editor.dispose();
      originalModel.dispose();
      modifiedModel.dispose();
    };
  }, [codeEditorRef, diff]);

  return (
    <BaseDialog
      background={DialogBackground.Secondary}
      isVisible={diff !== null}
      hasBackdrop
      onClose={onClose}
      UNSAFE_style={{ width: '80vw' }}
    >
      <Container isFill direction={ContainerDirection.Vertical}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', zIndex: 100 }}>
          <IconButton icon={IconName.Close} onClick={onClose} />
        </div>
        <div ref={codeEditorRef} style={{ height: '80vh' }} />
      </Container>
    </BaseDialog>
  );
}
