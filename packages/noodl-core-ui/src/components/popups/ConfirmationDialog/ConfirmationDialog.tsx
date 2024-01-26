import {
  PrimaryButton,
  PrimaryButtonVariant
} from '@noodl-core-ui/components/inputs/PrimaryButton';
import { BaseDialog } from '@noodl-core-ui/components/layout/BaseDialog';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { PopupSection } from '@noodl-core-ui/components/popups/PopupSection';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Slot } from '@noodl-core-ui/types/global';
import React from 'react';
import css from './ConfirmationDialog.module.scss';

export interface ConfirmationDialogProps {
  title?: string;
  message?: string | Slot;
  confirmButtonLabel?: string;
  cancelButtonLabel?: string;

  isVisible?: boolean;
  isDangerousAction?: boolean;
  isCancelButtonHidden?: boolean;

  onConfirm?: () => void;
  onCancel?: () => void;
}

export function ConfirmationDialog({
  title = 'Please confirm',
  message,
  confirmButtonLabel = 'Continue',
  cancelButtonLabel = 'Cancel',

  isVisible,
  isDangerousAction,
  isCancelButtonHidden,

  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  return (
    <BaseDialog isVisible={isVisible} hasBackdrop onClose={onCancel}>
      <div className={css['Root']}>
        <PopupSection title={title} hasBottomBorder>
          {message && <Text>{message}</Text>}
        </PopupSection>
        <PopupSection>
          <Container direction={ContainerDirection.Horizontal}>
            <PrimaryButton
              variant={isDangerousAction ? PrimaryButtonVariant.Danger : PrimaryButtonVariant.Cta}
              label={confirmButtonLabel}
              hasRightSpacing
              onClick={onConfirm}
            />
            {!isCancelButtonHidden && <PrimaryButton
              variant={PrimaryButtonVariant.Muted}
              label={cancelButtonLabel}
              onClick={onCancel}
            />}
          </Container>
        </PopupSection>
      </div>
    </BaseDialog>
  );
}
