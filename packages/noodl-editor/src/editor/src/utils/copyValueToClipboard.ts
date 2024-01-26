import { ToastLayer } from '../views/ToastLayer/ToastLayer';

export interface CopyValueToClipboardArgs {
  value: any;
  successMessage?: string;
  onSuccess?: () => void;
  onError?: (error: TSFixme) => void;
}

/**
 * Simple copy to clipboard with ToastLayer support.
 *
 * @param param0
 * @returns
 */
export function copyValueToClipboard({
  value,
  successMessage,
  onSuccess,
  onError
}: CopyValueToClipboardArgs): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let valueToCopy = value;

    if (typeof value !== 'string') {
      valueToCopy = value.toString();
    }

    navigator.clipboard.writeText(valueToCopy).then(
      function () {
        ToastLayer.showSuccess(successMessage || 'Copying to clipboard was successful!');
        onSuccess && onSuccess();
        resolve();
      },
      function (err) {
        ToastLayer.showError('Could not copy text to clipboard!');
        onError && onError(err);
        reject();
      }
    );
  });
}
