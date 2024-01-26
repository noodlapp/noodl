import { ReActCommand, ReActCommandLexer } from '@noodl-models/AiAssistant/_backend/commandLexer';
import { ChatHistory, ChatMessageType } from '@noodl-models/AiAssistant/ChatHistory';
import { Ai } from '@noodl-models/AiAssistant/context/ai-api';
import { AiCopilotChatMessage } from '@noodl-models/AiAssistant/interfaces';
import { NodeGraphModel } from '@noodl-models/nodegraphmodel';

export class ReActContext {
  snowflakeId: string;
  chatHistory: ChatHistory;
  nodeGraphModel?: NodeGraphModel;
}

export abstract class ReActBaseTool {
  public abstract execute(command: ReActCommand, context: ReActContext): void;
}

export abstract class ReActAgent<TParams = unknown> {
  protected abstract get commands(): Record<string, ReActBaseTool>;
  protected abstract createSystemContext(context: ReActContext, params: TParams): string;
  protected abstract createHistory(context: ReActContext, params: TParams): AiCopilotChatMessage[];

  public async act(context: ReActContext, params: TParams) {
    const parser = new ReActCommandLexer();

    const systemContext = this.createSystemContext(context, params);
    const history = this.createHistory(context, params);

    context.chatHistory.add({
      type: ChatMessageType.Assistant,
      content: ''
    });

    await Ai.chatStream({
      messages: [
        {
          role: 'system',
          content: systemContext
        },
        ...history
      ],
      provider: {
        model: 'gpt-4',
        temperature: 0
      },
      onStream: (_, text) => {
        const newCommands = parser.append(text);
        console.log('[stream]', _);
        newCommands.forEach((command) => {
          if (this.commands[command.type]) {
            this.commands[command.type].execute(command, context);
          }
        });
      }
    });
  }
}
