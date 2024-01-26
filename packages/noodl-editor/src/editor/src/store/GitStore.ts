import Store from 'electron-store';
import { GitProvider } from '@noodl/git';

import { decryptString, encryptString, isEncryptionAvailable } from './_internal/StorageApi';

const store = new Store<Record<string, string>>({
  name: 'git_external',
  encryptionKey: 'b4a5d3b3-5e3e-477e-a978-9d347bc8b835'
});

export type GitProviderConfig = {
  username?: string;
  password: string;
};

export const GitStore = {
  isAvailable(): Promise<boolean> {
    return isEncryptionAvailable();
  },
  async get(provider: GitProvider, projectId: string): Promise<Partial<GitProviderConfig>> {
    if (projectId) {
      const key = `${provider}__${projectId}`;
      const encrypted = store.get(key);
      const decrypted = encrypted ? await decryptString(encrypted) : undefined;
      return decrypted ? JSON.parse(decrypted) : undefined;
    }
    return undefined;
  },
  async set(provider: GitProvider, projectId: string, value: GitProviderConfig) {
    const key = `${provider}__${projectId}`;
    const encrypted = await encryptString(JSON.stringify(value));
    store.set(key, encrypted);
  }
};
