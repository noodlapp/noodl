import { AiTemplate } from '@noodl-models/AiAssistant/AiAssistantModel';
import { ChatHistory } from '@noodl-models/AiAssistant/ChatHistory';
import { Ai } from '@noodl-models/AiAssistant/context/ai-api';
import { AiQuery } from '@noodl-models/AiAssistant/context/ai-query';
import {
  AiCopilotChatStreamArgs,
  AiCopilotChatStreamXmlArgs,
  IAiCopilotContext
} from '@noodl-models/AiAssistant/interfaces';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';

export class AiCopilotContext implements IAiCopilotContext {
  public readonly abortController = new AbortController();

  constructor(
    public readonly template: AiTemplate,
    public readonly chatHistory: ChatHistory,
    public readonly node: NodeGraphNode
  ) {}

  chatStream(args: AiCopilotChatStreamArgs): Promise<string> {
    if (!args.abortController) {
      args.abortController = this.abortController;
    }
    return Ai.chatStream(args);
  }

  chatStreamXml(args: AiCopilotChatStreamXmlArgs): Promise<string> {
    if (!args.abortController) {
      args.abortController = this.abortController;
    }
    return AiQuery.chatStreamXml(args);
  }

  toObject(): IAiCopilotContext {
    return {
      template: this.template,
      chatHistory: this.chatHistory,
      node: this.node,
      chatStream: this.chatStream.bind(this),
      chatStreamXml: this.chatStreamXml.bind(this)
    };
  }
}
