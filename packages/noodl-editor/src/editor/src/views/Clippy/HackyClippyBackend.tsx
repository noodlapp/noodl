import { AiAssistantModel } from '@noodl-models/AiAssistant';
import { LocalUserIdentity } from '@noodl-utils/LocalUserIdentity';

import { NodeGraphEditor } from '../nodegrapheditor';
import { copilotNodeCommands, copilotNodeInstaPromptable } from './ClippyCommandsMetadata';
import { handleImageCommand } from './Commands/ImageCommand';
import { handleSuggestionCommand } from './Commands/SuggestCommand';
import { handleUICommand } from './Commands/UICommand';

export type CommandResultItem = {
  name: string;
  description: string;
  prompt: string;
};

export interface CommandHandlerOptions {
  nodeGraph: NodeGraphEditor;
}

export async function handleCommand(
  command: string,
  prompt: string,
  options: CommandHandlerOptions,
  statusCallback: (string) => void
): Promise<CommandResultItem[] | void> {
  console.log(command, prompt);
  if (command === '/ui') {
    return await handleUICommand(prompt, statusCallback, {
      allowImageGeneration: true,
      allowImageNode: true
    });
  }

  if (copilotNodeInstaPromptable.includes(command)) {
    const item = copilotNodeCommands.find((x) => x.title.toLowerCase() === command);
    if (!item) throw new Error('Invalid command');
    const templateId = item.templateId;

    const panAndScale = options.nodeGraph.getPanAndScale();

    const x = Math.round(Math.random() * 100 + 50);
    const y = Math.round(Math.random() * 100 + 50);

    const scaledPos = {
      x: x / panAndScale.scale - panAndScale.x,
      y: y / panAndScale.scale - panAndScale.y
    };

    const context = await AiAssistantModel.instance.createNode(templateId, null, scaledPos);
    context.chatHistory.add({
      content: prompt,
      metadata: {
        user: LocalUserIdentity.getUserInfo()
      }
    });

    statusCallback('Processing...');

    await AiAssistantModel.instance.send(context);

    return;
  }

  if (command === '/image') {
    return await handleImageCommand(prompt, statusCallback);
  } else if (command === '/suggest') {
    return await handleSuggestionCommand(prompt, statusCallback);
  }
}
