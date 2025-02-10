import { ToastLayer } from '../../../views/ToastLayer';

export type Command = {
  kind: 'notify';
  messageType: 'info' | 'success' | 'error';
  message: string;
};

export async function execute(command: Command, _event: MessageEvent) {
  switch (command.messageType || 'info') {
    case 'info': {
      ToastLayer.showInteraction(String(command.message));
      break;
    }
    case 'success': {
      ToastLayer.showSuccess(String(command.message));
      break;
    }
    case 'error': {
      ToastLayer.showError(String(command.message));
      break;
    }
  }
}
