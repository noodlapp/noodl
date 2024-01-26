import { fork } from 'node:child_process';
import path from 'node:path';
import { platform } from '@noodl/platform';

export function verifyJsonFile(filePath): Promise<boolean> {
  const verifyJsonIndexFilePath = path.join(platform.getAppPath(), 'src/editor/verify-json-index.js');

  const child = fork(verifyJsonIndexFilePath, [filePath]);

  return new Promise<boolean>((resolve, reject) => {
    child.on('close', (code) => {
      resolve(code === 0);
    });
    child.on('error', (e) => {
      reject(e);
    });
  });
}
