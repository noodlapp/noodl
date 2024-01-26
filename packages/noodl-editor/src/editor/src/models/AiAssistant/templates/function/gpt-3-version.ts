import { ChatMessageType, ChatSuggestion } from '@noodl-models/AiAssistant/ChatHistory';
import { AiUtils } from '@noodl-models/AiAssistant/context/ai-utils';
import { IAiCopilotContext } from '@noodl-models/AiAssistant/interfaces';
import {
  FUNCTION_CODE_CONTEXT,
  FUNCTION_CODE_CONTEXT_EDIT,
  FUNCTION_CODE_EXPLAIN
} from '@noodl-models/AiAssistant/templates/function';
import { extractCodeBlock, wrapInput, wrapOutput } from '@noodl-models/AiAssistant/templates/helper';
import { guid } from '@noodl-utils/utils';

export async function execute({ node, chatHistory, chatStream, chatStreamXml }: IAiCopilotContext) {
  const activityCodeGenId = 'code-generation';

  const currentScript = node.getParameter('functionScript');

  // ---
  // Generate the code

  chatHistory.addActivity({
    id: activityCodeGenId,
    name: 'Generating code...'
  });

  const history = chatHistory.messages.map((x) => ({
    role: String(x.type),
    content: x.content
  }));

  const messages = currentScript
    ? [
        // TODO: Enable this again later, ...history.slice(0, -1),
        {
          role: 'system',
          content: FUNCTION_CODE_CONTEXT_EDIT.replace('%{code}%', currentScript)
        },
        history.at(-1)
      ]
    : [{ role: 'system', content: FUNCTION_CODE_CONTEXT }, ...history];

  const fullCodeText = await chatStream({
    provider: {
      model: 'gpt-3.5-turbo',
      temperature: 0.0,
      max_tokens: 2048
    },
    messages,
    onStream(fullText) {
      console.log('code:', fullText);
    }
  });

  const codeText = extractCodeBlock(fullCodeText);

  // ---
  // Evaluate the code if it is valid.

  try {
    // Allow async/await
    const wrappedCode = `async function validateCode() { ${codeText} }`;
    new Function(wrappedCode);
  } catch (error) {
    console.error(error);

    chatHistory.add({
      type: ChatMessageType.Assistant,
      content: ''
    });

    await AiUtils.fakeTokenStream(`I'm sorry. I'm afraid I can't do that.`, (delta, fullText) => {
      chatHistory.updateLast({
        content: fullText
      });
    });

    chatHistory.clearActivities();

    return;
  }

  // Set the parameter
  node.setParameter('functionScript', codeText);

  // Save it in the history, so it will be possible to go back and forth.
  chatHistory.updateLast({
    metadata: {
      code: codeText
    }
  });

  chatHistory.removeActivity(activityCodeGenId);

  // ---
  // Explain the code
  chatHistory.add({
    type: ChatMessageType.Assistant,
    content: ''
  });

  let questionIndex = 0;
  const result = [''];

  await chatStreamXml({
    messages: [
      {
        role: 'system',
        content: FUNCTION_CODE_EXPLAIN(false)
      },
      { role: 'user', content: codeText }
    ],
    provider: {
      model: 'gpt-3.5-turbo',
      temperature: 0.0,
      max_tokens: 2048
    },
    onStream(tagName, text) {
      // TODO: It calls an empty string at the end, why?
      if (text.length === 0) {
        return;
      }

      console.log('stream', tagName, text);

      switch (tagName) {
        case 'explain': {
          result[result.length - 1] = text;
          break;
        }

        case 'Input': {
          result[result.length - 1] = wrapInput(text);
          break;
        }

        case 'Output': {
          result[result.length - 1] = wrapOutput(text);
          break;
        }
      }

      if (['explain', 'Input', 'Output'].includes(tagName)) {
        chatHistory.updateLast({
          content: result.join('')
        });
      }
    },
    onTagOpen(tagName) {
      switch (tagName) {
        case 'Input':
        case 'Output': {
          result.push('');
          break;
        }
      }
    },
    onTagEnd(tagName, fullText) {
      console.log('[done]', tagName, fullText);

      switch (tagName) {
        case 'label': {
          node.setLabel(fullText);
          break;
        }

        case 'explain': {
          result[result.length - 1] = fullText;
          result.push('');
          break;
        }

        case 'Input': {
          result[result.length - 1] = wrapInput(fullText);
          result.push('');
          break;
        }

        case 'Output': {
          result[result.length - 1] = wrapOutput(fullText);
          result.push('');
          break;
        }

        case 'question': {
          const suggestions: ChatSuggestion[] =
            (chatHistory.messages[chatHistory.messages.length - 1].metadata.suggestions as ChatSuggestion[]) || [];
          suggestions[questionIndex] = {
            id: guid(),
            text: fullText.endsWith('?') ? fullText : fullText + '?'
          };

          chatHistory.updateLast({
            metadata: {
              suggestions
            }
          });

          questionIndex++;
          break;
        }
      }

      if (['explain', 'Input', 'Output'].includes(tagName)) {
        chatHistory.updateLast({
          content: result.join('')
        });
      }
    }
  });
}
