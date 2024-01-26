import { PrimaryButton, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { AppRegistry } from '@noodl-models/app_registry';
import React from 'react';
import { EditorDocumentProvider } from '../../EditorDocument';
import css from './ComponentDiffTopbar.module.scss';

interface ComponentDiffTopbarProps {
  title: string;
}

export function ComponentDiffTopbar({ title }: ComponentDiffTopbarProps) {
  return (
    <div className={css.Root}>
      <Label hasLeftSpacing>{title}</Label>
      <div style={{ marginLeft: 'auto' }}>
        <PrimaryButton
          label="Exit"
          variant={PrimaryButtonVariant.MutedOnLowBg}
          onClick={() => {
            AppRegistry.instance.openDocument(EditorDocumentProvider.ID);
          }}
        />
      </div>
    </div>
  );
}
