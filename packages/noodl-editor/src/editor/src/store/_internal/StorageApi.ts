import { ipcRenderer } from 'electron';

import { guid } from '@noodl-utils/utils';

const _responseHandlers = {};
ipcRenderer.on('storage-api', function (_, args) {
  const token = args.token;

  if (!_responseHandlers[token]) return;
  _responseHandlers[token](args.data);
  delete _responseHandlers[token];
});

function send<T = unknown>(method: string, ...args: unknown[]): Promise<T> {
  return new Promise<T>((resolve) => {
    const token = guid();
    _responseHandlers[token] = (args: any) => {
      resolve(args);
    };

    ipcRenderer.send('storage-api', { token, method, args });
  });
}

export function isEncryptionAvailable(): Promise<boolean> {
  return send('isEncryptionAvailable');
}

export function decryptString(value: string): Promise<string> {
  return send('decryptString', value);
}

export function encryptString(value: string): Promise<string> {
  return send('encryptString', value);
}
