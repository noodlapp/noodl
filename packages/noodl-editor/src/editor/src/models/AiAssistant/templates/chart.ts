import { ChatMessageType } from '@noodl-models/AiAssistant/ChatHistory';
import { AiUtils } from '@noodl-models/AiAssistant/context/ai-utils';
import { AiNodeTemplate } from '@noodl-models/AiAssistant/interfaces';
import { extractCodeBlock, wrapInput, wrapOutput } from '@noodl-models/AiAssistant/templates/helper';
import { ConnectionInspector } from '@noodl-utils/connectionInspector';

export const template: AiNodeTemplate = {
  type: 'blue',
  name: 'noodl.chart-js.chart',
  onMessage: async ({ node, chatHistory, chatStream, chatStreamXml }) => {
    const activityId = 'processing';
    const activityCodeGenId = 'code-generation';

    chatHistory.addActivity({
      id: activityId,
      name: 'Processing'
    });

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

    const data = await ConnectionInspector.instance.getConnectionValue(node, 'input', 'data');
    console.log('fullData', data);

    const shortData = Array.isArray(data) ? data.slice(0, 3) : data;
    const shortDataJson = JSON.stringify(shortData);
    console.log('data', shortDataJson);

    const currentScript = node.getParameter('functionScript');
    const messages = currentScript
      ? [
          {
            role: 'system',
            content: CONTEXT_EDIT.replace('%{code}%', currentScript).replace('%{data}%', shortDataJson)
          },
          history.at(-1)
        ]
      : [{ role: 'system', content: CONTEXT.replace('%{data}%', shortDataJson) }, ...history];

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

    const codeText = extractCodeBlock(fullCodeText);

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

      await AiUtils.fakeTokenStream(`I'm sorry. I'm afraid I can't do that.`, (delta, fullText) => {
        chatHistory.updateLast({
          content: fullText
        });
      });

      chatHistory.removeActivity(activityId);

      return;
    }

    // Set the parameter
    node.setParameter('scriptSetup', codeText);

    // Save it in the history, so it will be possible to go back and forth.
    chatHistory.updateLast({
      metadata: {
        code: codeText
      }
    });

    chatHistory.removeActivity(activityCodeGenId);

    // ---
    // Explain the code
    const snowflakeId = chatHistory.add({
      type: ChatMessageType.Assistant,
      content: ''
    });

    const result = [''];

    const fullText = await chatStreamXml({
      messages: [
        {
          role: 'system',
          content: CONTEXT_EXPLAIN
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
        }

        if (['explain', 'Input', 'Output'].includes(tagName)) {
          chatHistory.updateLast({
            content: result.join('')
          });
        }
      }
    });

    console.log('fullText', fullText);

    chatHistory.removeActivity(activityId);
  }
};

const CONTEXT = `###Instructions###
- You will be creating javascript config objects for the chartjs library.
- You ONLY need to provide the config object.
- An input in the javascript code must follow the format "Inputs.InputName".
- An input in the javascript code is only read, never written to.
- Don't use features that require external libraries, like date adapters.

### Examples ###
A chart showing number of votes for different colors:
\`\`\`
if (!Inputs.data) return;

config  = {
  type: 'bar',
  data: {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [{
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
}
\`\`\`

Here is my input data:
\`\`\`
Inputs.data = %{data}%
\`\`\`

###Task###
ONLY respond with javascript code following the instructions and starting and ending with \`\`\`
`;

const CONTEXT_EDIT = `###Instructions###
- You will be creating javascript config objects for the chartjs library.
- You ONLY need to provide the config object.
- An input in the javascript code must follow the format "Inputs.InputName".
- An input in the javascript code is only read, never written to.
- Don't use features that require external libraries, like date adapters.

Here is my input data:
\`\`\`
Inputs.data = %{data}%
\`\`\`

We are starting from this code and will only modify it:
\`\`\`
%{code}%
\`\`\`

###Task###
ONLY respond with javascript code following the instructions and starting and ending with \`\`\`
`;

const CONTEXT_EXPLAIN = `###Context###
- This is a Chart node in Noodl using Chart.js.
- We are currently inside a Component with this node created, the node have the function inside.

###Instructions###
Analyse the function and create an explanation related to the code.

###Explanation###
Explain with 2-5 sentences what the function does.
- Always include the property names of the Inputs and Outputs objects.
- Always format the property names of the Inputs like this: <Input>input name</Input>
- Always format the property names of the Outputs like this: <Output>output name</Output>

###Label###
Create a label that summarises what the function does.

###Example###
<label>Show a bar chart of cars</label>
<explain></explain>`;
