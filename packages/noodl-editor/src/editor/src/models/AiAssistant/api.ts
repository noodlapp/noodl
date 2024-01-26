export type AiAssistantModel = {
  name: string;
  displayName: string;
  promptTokenCost: number;
  completionTokenCost: number;
};

export interface AiAssistantConfig {
  version: string;
  models: AiAssistantModel[];
}

export async function verifyOpenAiApiKey(apiKey: string): Promise<Record<string, { id: string }> | null> {
  const response = await fetch(`https://api.openai.com/v1/models`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + apiKey
    }
  });

  if (response.status !== 200) {
    return null;
  }

  const json = await response.json();

  const models = json.data.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  return models;
}

export namespace AiAssistantApi {
  export async function getConfig(): Promise<AiAssistantConfig> {
    return {
      version: '0.0.0',
      models: [
        {
          name: 'gpt-4',
          displayName: 'gpt-4 (8k context)',
          promptTokenCost: 0.03,
          completionTokenCost: 0.06
        },
        {
          name: 'gpt-3.5-turbo',
          displayName: 'gpt-3.5-turbo',
          promptTokenCost: 0.002,
          completionTokenCost: 0.03
        }
      ]
    };
  }
}
