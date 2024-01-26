import { ReActCommand, ReActCommandLexer } from '@noodl-models/AiAssistant/_backend/commandLexer';
import { Parser } from '@noodl-models/AiAssistant/_backend/parser';
import { Ai } from '@noodl-models/AiAssistant/context/ai-api';
import { AiCopilotChatArgs, AiCopilotChatStreamXmlArgs } from '@noodl-models/AiAssistant/interfaces';

export namespace AiQuery {
  export async function chatReAct({
    messages,
    provider,
    abortController
  }: AiCopilotChatArgs): Promise<{ commands: readonly ReActCommand[]; fullText: string }> {
    const parser = new ReActCommandLexer();
    let fullText = '';

    await Ai.chatStream({
      provider,
      messages,
      abortController,
      onStream: (_, text) => {
        if (text) {
          fullText += text;
          parser.append(text);
        }
      }
    });

    return {
      commands: parser.commands,
      fullText
    };
  }

  export async function chatStreamXml({
    messages,
    provider,
    abortController,
    onEnd,
    onStream,
    onTagOpen,
    onTagEnd
  }: AiCopilotChatStreamXmlArgs): Promise<string> {
    const parser = new Parser(
      (tagName, text) => {
        console.debug(tagName, text);
        onStream && onStream(tagName, text);
      },
      (tagName, attributes) => {
        onTagOpen && onTagOpen(tagName, attributes);
      },
      (tagName, fullText) => {
        onTagEnd && onTagEnd(tagName, fullText);
      }
    );

    await Ai.chatStream({
      provider,
      messages,
      abortController,
      onEnd,
      onStream: (_, text) => {
        if (text) {
          parser.append(text);
        }
      }
    });

    return parser.getFullText();
  }
}
