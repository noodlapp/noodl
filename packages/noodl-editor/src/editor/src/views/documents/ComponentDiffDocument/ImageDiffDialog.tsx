import React from 'react';
import { IImageDiff } from '@noodl/git/src/core/models/diff-data';
import { BaseDialog, DialogBackground } from '@noodl-core-ui/components/layout/BaseDialog';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';

export interface ImageDiffDialogProps {
  diff: IImageDiff;
  onClose: () => void;
}

export function ImageDiffDialog({ diff, onClose }: ImageDiffDialogProps) {
  return (
    <BaseDialog
      background={DialogBackground.Secondary}
      isVisible={diff !== null}
      hasBackdrop
      onClose={onClose}
      UNSAFE_style={{ width: '80vw' }}
    >
      <Container isFill direction={ContainerDirection.Horizontal}>
        {Boolean(diff.original) && (
          <div style={{ width: '50%', padding: '8px' }}>
            <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
              <Label size={LabelSize.Big}>Previous</Label>
            </div>
            <img src={diff.original.dataSource} style={{ width: '100%' }} />
          </div>
        )}
        <div style={{ width: '50%', padding: '8px' }}>
          <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
            <Label size={LabelSize.Big}>Current</Label>
          </div>
          <img src={diff.modified.dataSource} style={{ width: '100%' }} />
        </div>
      </Container>
    </BaseDialog>
  );
}
