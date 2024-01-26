import { AiTemplate } from '@noodl-models/AiAssistant/AiAssistantModel';
import { ChatHistory, ChatMessage } from '@noodl-models/AiAssistant/ChatHistory';
import { CopilotMessage, CopilotMessageAssistant } from '@noodl-models/AiAssistant/ChatMessage';
import { ChatGPTMessage } from '@noodl-models/AiAssistant/_backend/mapper';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { IModel } from '@noodl-utils/model';

export type AiNodeTemplateType = 'pink' | 'purple' | 'green' | 'grey' | 'blue';

export type AiCopilotTextProviders = {
  model: 'text-davinci-003',
  temperature?: number;
  max_tokens?: number;
}

export type ModelName = 'gpt-3.5-turbo' | 'gpt-4';

export type AiCopilotChatProviders = {
  model: 'gpt-3.5-turbo',
  temperature?: number;
  max_tokens?: number;
} | {
  model: 'gpt-4',
  temperature?: number;
  max_tokens?: number;
}

export type AiCopilotTextArgs = {
  content: string;
  provider?: AiCopilotTextProviders;
}

export type AiCopilotChatMessage = {
  role: 'system' | 'user' | 'assistant' | string;
  content: string;
}

export type AiCopilotChatArgs = {
  messages: AiCopilotChatMessage[];
  provider?: AiCopilotChatProviders;
  abortController?: AbortController;
}

export type AiCopilotChatStreamArgs = Prettify<AiCopilotChatArgs & {
  onStream?: (fullText: string, text: string) => void;
  onEnd?: () => void;
}>;

export type AiCopilotChatStreamXmlArgs = Prettify<AiCopilotChatArgs & {
  onStream?: (tagName: string, text: string) => void;
  onTagOpen?: (tagName: string, attributes: Record<string, string>) => void;
  onTagEnd?: (tagName: string, fullText: string) => void;
  onEnd?: () => void;
}>;

export interface IAiCopilotContext {
  template: AiTemplate;
  chatHistory: ChatHistory;
  node: NodeGraphNode;

  chatStream(args: AiCopilotChatStreamArgs): Promise<string>;
  chatStreamXml(args: AiCopilotChatStreamXmlArgs): Promise<string>;
}

export type AiNodeTemplate = {
  type: AiNodeTemplateType;
  name: string;
  nodeDisplayName?: string;
  onMessage: (context: IAiCopilotContext, message: ChatMessage) => Promise<void>;
}

// Memory fragments?
export interface ICopilotMemory {
  get messages(): ReadonlyArray<CopilotMessage>;

  add(message: CopilotMessage): void;

  clear(): void;

  forget(): void;

  fetch(tokenLimit: number): ChatGPTMessage[];
}

export interface ICopilotHistory {
  /** Send more information to AI. */
  respond(text: string): void;

  assistant(text: string): void;

  user(text: string): void;

  /** Notify the user. */
  notify(text: string): void;
}

export enum CopilotState {
  Idle,
  Processing
}

export interface ICopilotAgentExecutor {
  state: CopilotState;
  currentResponse: CopilotMessageAssistant | null;

  stop(): void;

  execute(): void;
}

export enum CopilotEvent {
  MessagesChanged,
  StateChanged
}

export type CopilotEvents = {
  [CopilotEvent.MessagesChanged]: () => void;
  [CopilotEvent.StateChanged]: () => void;
};

export interface ICopilot extends IModel<CopilotEvent, CopilotEvents>, ICopilotHistory {
  get memory(): ICopilotMemory;
  get executor(): ICopilotAgentExecutor;
}
