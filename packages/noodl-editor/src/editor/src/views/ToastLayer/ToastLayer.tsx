import React from 'react';
import toast from 'react-hot-toast';

import { ToastCard, ToastType } from './components/ToastCard';

export const ToastLayer = {
  showInteraction(message: string) {
    toast.success(<ToastCard type={ToastType.Neutral} message={message} />);
  },

  showActivity(message: string, toastId = 'no-id') {
    toast.promise(
      new Promise(() => {
        // noop
      }),
      {
        loading: <ToastCard type={ToastType.Pending} message={message} hasActivity />,
        success: '',
        error: ''
      },
      { id: toastId, duration: 1000000 }
    );
  },

  hideActivity(toastId = 'no-id') {
    toast.dismiss(toastId);
  },

  hideAll() {
    toast.dismiss();
  },

  showSuccess(message: string) {
    toast.success(<ToastCard type={ToastType.Success} message={message} />);
  },

  showError(message: string, duration = 1000000) {
    toast.error((t) => <ToastCard type={ToastType.Danger} message={message} onClose={() => toast.dismiss(t.id)} />, {
      duration
    });
  },

  showProgress(message: string, progress: number, toastId: string) {
    if (progress) {
      toast.loading(<ToastCard type={ToastType.Pending} message={message} progress={progress} hasActivity />, {
        id: toastId
      });
    }
  },

  hideProgress(toastId: string) {
    toast.dismiss(toastId);
  }
};
