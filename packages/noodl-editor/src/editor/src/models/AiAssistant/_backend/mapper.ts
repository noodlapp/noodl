import { CopilotMessage, CopilotMessageType, CopilotRole } from '@noodl-models/AiAssistant/ChatMessage';

export interface ChatGPTMessage {
  role: 'system' | 'assistant' | 'user';
  name?: string;
  content: string;
}

export function isVisibleToOpenAI(message: CopilotMessage) {
  return [
    CopilotMessageType.Assistant,
    CopilotMessageType.AssistantData,
    CopilotMessageType.System,
    CopilotMessageType.User
  ].includes(message.type);
}

export function toOpenAI(message: CopilotMessage): ChatGPTMessage {
  // if (message.name) {
  //   return {
  //     role: this.role,
  //     name: this.name,
  //     content: this.content
  //   };
  // }

  switch (message.role) {
    case CopilotRole.Assistant:
      return {
        role: message.role,
        content: message.response
      };

    case CopilotRole.System:
      return {
        role: message.role,
        content: message.response
      };

    case CopilotRole.User:
      return {
        role: message.role,
        content: `Message ${message.index}: ${message.prompt}`
      };
  }
}
