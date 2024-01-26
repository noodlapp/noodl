import React, { useState, useCallback } from 'react';

import { HtmlRenderer } from '@noodl-core-ui/components/common/HtmlRenderer';
import {
  ConfirmationDialog,
  ConfirmationDialogProps
} from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog';

export interface UseConfirmationDialogOptions
  extends Omit<ConfirmationDialogProps, 'isVisible' | 'onConfirm' | 'onCancel'> {}

export function useConfirmationDialog(
  options: UseConfirmationDialogOptions,
  skipRejectCallback?: boolean
): [() => JSX.Element, () => Promise<void>] {
  const [promise, setPromise] =
    useState<{
      resolve: (value: void | PromiseLike<void>) => void;
      reject: (reason?: any) => void;
    }>(null);

  function confirmationPromise() {
    return new Promise<void>((resolve, reject) => {
      setPromise({ resolve, reject });
    });
  }

  const Dialog = useCallback(
    () => (
      <ConfirmationDialog
        isVisible={promise !== null}
        title={options.title}
        confirmButtonLabel={options.confirmButtonLabel}
        cancelButtonLabel={options.cancelButtonLabel}
        message={options.message}
        isDangerousAction={options.isDangerousAction}
        isCancelButtonHidden={options.isCancelButtonHidden}
        onConfirm={() => {
          promise?.resolve();
          setPromise(null);
        }}
        onCancel={() => {
          !skipRejectCallback && promise?.reject(false);
          setPromise(null);
        }}
      />
    ),
    [
      promise,
      skipRejectCallback,
      options.title,
      options.confirmButtonLabel,
      options.cancelButtonLabel,
      options.message,
      options.isDangerousAction,
      options.isCancelButtonHidden
    ]
  );

  return [Dialog, confirmationPromise];
}

export function useSimpleConfirmationDialog(
  options: UseConfirmationDialogOptions
): [() => JSX.Element, (message: string) => Promise<void>] {
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [Dialog, handleConfirmation] = useConfirmationDialog({
    ...options,
    message: <HtmlRenderer html={dialogMessage} />
  });

  function handle(message: string) {
    setDialogMessage(message);
    return handleConfirmation();
  }

  return [Dialog, handle];
}
