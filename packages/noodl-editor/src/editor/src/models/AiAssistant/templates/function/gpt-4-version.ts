import { ChatMessageType, ChatSuggestion } from '@noodl-models/AiAssistant/ChatHistory';
import { AiQuery } from '@noodl-models/AiAssistant/context/ai-query';
import { AiUtils } from '@noodl-models/AiAssistant/context/ai-utils';
import { IAiCopilotContext } from '@noodl-models/AiAssistant/interfaces';
import {
  FUNCTION_CODE_CONTEXT,
  FUNCTION_CODE_CONTEXT_EDIT,
  FUNCTION_CODE_EXPLAIN,
  FUNCTION_CODE_EXPLAIN_PROMPT,
  FUNCTION_CODE_QUESTION
} from '@noodl-models/AiAssistant/templates/function';
import { extractCodeBlockWithText, wrapInput, wrapOutput } from '@noodl-models/AiAssistant/templates/helper';
import { guid } from '@noodl-utils/utils';

export async function execute({ node, chatHistory, chatStream, chatStreamXml }: IAiCopilotContext) {
  const activityCodeGenId = 'code-generation';

  const currentScript = node.getParameter('functionScript');

  let questionPrompt = `Group the question into FUNCTION or QUESTION

${currentScript ? '- The user have a function that they want answers to or to change it.' : ''}       

Q["Get the current location of the device"]
A["FUNCTION"]

Q["What can you do?"]
A["QUESTION"]

Q["Output the color red"]
A["FUNCTION"]`;

  if (currentScript) {
    questionPrompt += `
Q["How does it work?"]
A["QUESTION"]

Q["Can we change it to blue?"]
A["FUNCTION"]

Q["Can we do it without an api?"]
A["FUNCTION"]`;
  }

  const question = await AiQuery.chatReAct({
    messages: [
      {
        role: 'system',
        content: questionPrompt
      },
      {
        role: 'user',
        content: `Q["${chatHistory.messages.at(-1).content}"]`
      }
    ],
    provider: {
      // NOTE: Tried with GPT 3.5 here before.
      //       Then this question doesnt work: "Can you make a function that starts recording from the microphone when it gets a start signal and stops recording when it gets a stop signal"
      model: 'gpt-4',
      temperature: 0.0
    }
  });

  if (question.commands.length === 0) {
    chatHistory.add({
      type: ChatMessageType.Assistant,
      content: ''
    });

    await AiUtils.fakeTokenStream(`Could you explain a little bit more what you would like?`, (_, fullText) => {
      chatHistory.updateLast({
        content: fullText
      });
    });

    return;
  }

  if (question.commands[0].args[0] === 'QUESTION') {
    const lastMessage = chatHistory.messages.at(-1).content;

    let suggestions = [];

    const lastAssistantMessage = chatHistory.messages.at(-2);
    if (lastAssistantMessage && lastAssistantMessage.metadata.suggestions) {
      const lastSuggestions = (lastAssistantMessage.metadata.suggestions as any[]) || [];
      const suggestionIndex = lastSuggestions.findIndex((x) => x.text === lastMessage);
      if (suggestionIndex !== -1) {
        suggestions = [...lastSuggestions].filter((_, index) => index !== suggestionIndex);
      }
    }

    chatHistory.add({
      type: ChatMessageType.Assistant,
      content: '',
      metadata: {
        suggestions
      }
    });

    const fullText = await chatStream({
      provider: {
        model: 'gpt-4',
        temperature: 0.0,
        max_tokens: 2048
      },
      messages: [
        {
          role: 'system',
          content: FUNCTION_CODE_QUESTION().replace('%{code}%', currentScript)
        },
        {
          role: 'user',
          content: lastMessage
        }
      ],
      onStream(fullText) {
        chatHistory.updateLast({
          content: fullText
        });
      }
    });

    chatHistory.updateLast({
      content: fullText
    });

    // TODO: If zero suggestions generate a new suggestions?

    return;
  }

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
      model: 'gpt-4',
      temperature: 0.0,
      max_tokens: 2048
    },
    messages,
    onStream(fullText) {
      console.log('code:', fullText);
    }
  });

  // Not sure if it will just reply with the code or with backticks,
  // would be nice to make a better prompt to handle it.
  const { codeBlocks, cleanedText } = extractCodeBlockWithText(fullCodeText);
  const codeText = codeBlocks.length > 0 ? codeBlocks[0] : '';

  if (codeBlocks.length === 0) {
    chatHistory.add({
      type: ChatMessageType.Assistant,
      content: ''
    });

    chatHistory.removeActivity(activityCodeGenId);

    await AiUtils.fakeTokenStreamFast(fullCodeText, (delta, fullText) => {
      chatHistory.updateLast({
        content: fullText
      });
    });

    chatHistory.clearActivities();

    return;
  }

  // ---
  // Evaluate the code if it is valid.
  try {
    // Allow async/await
    const wrappedCode = `async function validateCode() { ${codeText} }`;
    new Function(wrappedCode);
  } catch (error) {
    console.error(error);

    chatHistory.removeActivity(activityCodeGenId);

    chatHistory.add({
      type: ChatMessageType.Assistant,
      content: ''
    });

    await AiUtils.fakeTokenStreamFast(fullCodeText, (delta, fullText) => {
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
      {
        role: 'user',
        content: FUNCTION_CODE_EXPLAIN_PROMPT(chatHistory.messages.at(-2).content, cleanedText, codeText)
      }
    ],
    provider: {
      model: 'gpt-4',
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
