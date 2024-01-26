import { AiAssistantModel } from '@noodl-models/AiAssistant/AiAssistantModel';
import { AiUtils } from '@noodl-models/AiAssistant/context/ai-utils';
import { Model } from '@noodl-utils/model';

export enum ChatMessageType {
  User = 'user',
  Assistant = 'assistant'
}

export enum ChatHistoryState {
  Idle,
  Processing
}

export type ChatHistoryActivityId = 'processing' | 'code-generation';

export type ChatHistoryActivity = {
  id: ChatHistoryActivityId | string;
  name: string;
  status?: string;
};

export type ChatMessage = {
  snowflakeId: string;
  type: ChatMessageType;
  content: string;
  metadata: Record<string, unknown>;
};

export type ChatSuggestion = {
  id: string;
  text: string;
};

export enum ChatHistoryEvent {
  MessagesChanged,
  ActivitiesChanged,
  MetadataChanged
}

type ChatHistoryEvents = {
  [ChatHistoryEvent.MessagesChanged]: () => void;
  [ChatHistoryEvent.ActivitiesChanged]: (activities: readonly ChatHistoryActivity[]) => void;
  [ChatHistoryEvent.MetadataChanged]: () => void;
};

export class ChatHistory extends Model<ChatHistoryEvent, ChatHistoryEvents> {
  private _messages: ChatMessage[] = [];
  private _activities: ChatHistoryActivity[] = [];
  private _metadata: Record<string, unknown>;

  get messages() {
    return this._messages;
  }

  get metadata() {
    return this._metadata;
  }

  get activities() {
    return this._activities;
  }

  get suggestions(): readonly ChatSuggestion[] {
    if (this._messages.length > 0) {
      const metadata = this._messages[this._messages.length - 1].metadata;
      return (metadata.suggestions as ChatSuggestion[]) || [];
    }

    // When there are no messages,
    // show a list of example suggestions
    const template = AiAssistantModel.instance.templates.find((x) => x.templateId === this.metadata.templateId);
    if (template) {
      return template.examples.map((x) => ({
        id: x,
        text: x
      }));
    }

    return [];
  }

  constructor(items: ChatMessage[], metadata: Record<string, unknown> = {}) {
    super();
    this._messages = items || [];
    this._metadata = metadata || {};
  }

  addActivity(activity: ChatHistoryActivity) {
    this._activities.push(activity);
    this.notifyListeners(ChatHistoryEvent.ActivitiesChanged, this._activities);
  }

  removeActivity(activityId: string) {
    const length = this._activities.length;
    this._activities = this._activities.filter((x) => x.id !== activityId);
    if (this._activities.length !== length) {
      this.notifyListeners(ChatHistoryEvent.ActivitiesChanged, this._activities);
    }
  }

  clearActivities() {
    if (this._activities.length === 0) return;
    this._activities.length = 0;
    this.notifyListeners(ChatHistoryEvent.ActivitiesChanged, this._activities);
  }

  add(message: PartialWithRequired<ChatMessage, 'content'>) {
    if (!message) {
      throw new Error();
    }

    message.snowflakeId = AiUtils.generateSnowflakeId();
    if (!message.type) message.type = ChatMessageType.User;
    if (!message.metadata) message.metadata = {};

    this.messages.push(message as ChatMessage);
    this.notifyListeners(ChatHistoryEvent.MessagesChanged);

    return message.snowflakeId;
  }

  updateLast(data?: Partial<Pick<ChatMessage, 'content' | 'metadata'>>) {
    if (data.content) {
      this.messages[this.messages.length - 1].content = data.content;
    }
    if (data.metadata) {
      this.messages[this.messages.length - 1].metadata = {
        ...this.messages[this.messages.length - 1].metadata,
        ...data.metadata
      };
    }

    this.notifyListeners(ChatHistoryEvent.MessagesChanged);
  }

  clear(): void {
    this._messages.length = 0;
    // this.copilot.notifyListeners(CopilotEvent.MessagesChanged);
  }

  removeLast(): void {
    this._messages.pop();
  }

  toJSON() {
    return {
      history: this._messages,
      metadata: this._metadata
    };
  }

  static fromJSON(json: any) {
    return new ChatHistory(json?.history, json?.metadata);
  }
}

export interface CreateNodeFileOptions {
  nodeId: string;
  templateId: string;
}
