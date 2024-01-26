// import Store from 'electron-store';

import { EditorSettings } from '@noodl-utils/editorsettings';

// import { decryptString, encryptString } from './_internal/StorageApi';

// const store = new Store<Record<string, string>>({
//   name: 'AiAssistant',
//   encryptionKey: 'b4a5d3b3-5e3e-477e-a978-9d347bc8b834',
//   defaults: {
//     defaultModel: 'gpt-4'
//   }
// });

const AI_ASSISTANT_API_KEY = 'aiAssistant.temporaryApiKey';
const AI_ASSISTANT_VERSION_KEY = 'aiAssistant.version';
const AI_ASSISTANT_VERIFIED_KEY = 'aiAssistant.verified';
const AI_ASSISTANT_ENDPOINT_KEY = 'aiAssistant.endpoint';
const AI_ASSISTANT_MODEL_KEY = 'aiAssistant.model';

export type AiVersion = 'disabled' | 'full-beta' | 'enterprise';

export type AiModel = 'gpt-3' | 'gpt-4';

export const OpenAiStore = {
  isEnabled(): boolean {
    const version = EditorSettings.instance.get(AI_ASSISTANT_VERSION_KEY);
    return version === 'full-beta';
  },
  getVersion(): AiVersion {
    return EditorSettings.instance.get(AI_ASSISTANT_VERSION_KEY) || 'full-beta';
  },
  getPrettyVersion(): string {
    switch (this.getVersion()) {
      case 'full-beta':
        return 'Full Beta';
      case 'enterprise':
        return 'Enterprise';
    }
    return null;
  },
  setVersion(value: AiVersion): void {
    EditorSettings.instance.set(AI_ASSISTANT_VERSION_KEY, value);
  },

  getApiKey() {
    return EditorSettings.instance.get(AI_ASSISTANT_API_KEY);
  },
  async setApiKey(value: string) {
    EditorSettings.instance.set(AI_ASSISTANT_API_KEY, value);
  },
  setIsAiApiKeyVerified(value: boolean) {
    EditorSettings.instance.set(AI_ASSISTANT_VERIFIED_KEY, value);
  },
  getIsAiApiKeyVerified() {
    return !!EditorSettings.instance.get(AI_ASSISTANT_VERIFIED_KEY);
  },
  setEndpoint(value: string) {
    EditorSettings.instance.set(AI_ASSISTANT_ENDPOINT_KEY, value);
  },
  getEndpoint() {
    return EditorSettings.instance.get(AI_ASSISTANT_ENDPOINT_KEY);
  },
  setModel(value: AiModel) {
    EditorSettings.instance.set(AI_ASSISTANT_MODEL_KEY, value);
  },
  getModel(): AiModel {
    return EditorSettings.instance.get(AI_ASSISTANT_MODEL_KEY) || 'gpt-3';
  }
};
