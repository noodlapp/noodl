import Store from 'electron-store';

import { decryptString, encryptString, isEncryptionAvailable } from './_internal/StorageApi';

const store = new Store<Record<string, string>>({
  name: 'cloudService_external_masterKey',
  encryptionKey: 'b4a5d3b3-5e3e-477e-a978-9d347bc8b833'
});

export const CloudServiceMasterKeyStore = {
  isAvailable(): Promise<boolean> {
    return isEncryptionAvailable();
  },
  async getMasterKey(environmentId: string) {
    if (environmentId) {
      const encrypted = store.get(environmentId);
      return encrypted ? await decryptString(encrypted) : undefined;
    }
    return undefined;
  },
  async setMasterKey(environmentId: string, masterKey: string) {
    if (environmentId) {
      const encrypted = await encryptString(masterKey);
      store.set(environmentId, encrypted);
    }
  }
};
