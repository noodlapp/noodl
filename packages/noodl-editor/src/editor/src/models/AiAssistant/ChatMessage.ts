export enum CopilotMessageType {
  User,
  System,
  Assistant,
  AssistantData,
  Debug
}

export enum CopilotRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
}

type CopilotMessageUser = {
  type: CopilotMessageType.User;
  role: CopilotRole.User;
  index: number;
  prompt: string;
};

export type CopilotMessageAssistant = {
  type: CopilotMessageType.Assistant | CopilotMessageType.AssistantData;
  role: CopilotRole.Assistant;
  subject: string;
  shortend: string;
  conversationStage: string;
  action: string;
  response: string;
};

type CopilotMessageSystem = {
  type: CopilotMessageType.Debug | CopilotMessageType.System;
  role: CopilotRole.System;
  response: string;
};

export type CopilotMessage = CopilotMessageUser | CopilotMessageAssistant | CopilotMessageSystem;

export namespace CopilotMessagePrompt {
  export function system(content: string): CopilotMessage {
    return {
      type: CopilotMessageType.System,
      role: CopilotRole.System,
      response: content
    };
  }

  export function debug(content: string): CopilotMessage {
    return {
      type: CopilotMessageType.Debug,
      role: CopilotRole.System,
      response: content
    };
  }

  export function user(prompt: string, index: number): CopilotMessage {
    return {
      type: CopilotMessageType.User,
      role: CopilotRole.User,
      index: index || -1,
      prompt: prompt.trim()
    };
  }
}

export namespace CopilotMessageUtils {
  export function isVisibleToUser(message: CopilotMessage) {
    return [CopilotMessageType.User, CopilotMessageType.Assistant].includes(message.type);
  }

  export function toText(message: CopilotMessage) {
    switch (message.role) {
      case CopilotRole.Assistant:
        return message.response;
      case CopilotRole.System:
        return message.response;
      case CopilotRole.User:
        return message.prompt;
    }
  }
}
