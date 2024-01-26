import React from 'react';

import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { CoreBaseDialog } from '@noodl-core-ui/components/layout/BaseDialog';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { Text } from '@noodl-core-ui/components/typography/Text';

export interface ConfirmDialogProps {
  title: string;
  text: string;

  confirmText?: string;
  abortText?: string;

  onConfirm?: () => void;
  onAbort?: () => void;
}

export function ConfirmDialog({
  title,
  text,

  confirmText,
  abortText,

  onConfirm,
  onAbort
}: ConfirmDialogProps) {
  return (
    <CoreBaseDialog title={title} isVisible hasBackdrop>
      <Box hasXSpacing hasYSpacing UNSAFE_style={{ maxWidth: '400px' }}>
        <Text>{text}</Text>
        <Box hasTopSpacing>
          <HStack hasSpacing>
            <PrimaryButton label={confirmText ?? 'Confirm'} size={PrimaryButtonSize.Small} onClick={onConfirm} />
            <PrimaryButton
              label={abortText ?? 'Cancel'}
              variant={PrimaryButtonVariant.Muted}
              size={PrimaryButtonSize.Small}
              onClick={onAbort}
            />
          </HStack>
        </Box>
      </Box>
    </CoreBaseDialog>
  );
}
