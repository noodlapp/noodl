import { OpenAiStore } from '@noodl-store/AiAssistantStore';

import { AiNodeTemplate } from '@noodl-models/AiAssistant/interfaces';
import * as GPT3 from '@noodl-models/AiAssistant/templates/function/gpt-3-version';
import * as GPT4 from '@noodl-models/AiAssistant/templates/function/gpt-4-version';

import { ToastLayer } from '../../../views/ToastLayer/ToastLayer';

export const template: AiNodeTemplate = {
  type: 'pink',
  name: 'JavaScriptFunction',
  onMessage: async (context) => {
    const version = OpenAiStore.getVersion();

    const activityId = 'processing';

    context.chatHistory.addActivity({
      id: activityId,
      name: 'Processing'
    });

    // ---
    console.log('using version: ', version);

    try {
      if ((version === 'enterprise' && OpenAiStore.getModel() === 'gpt-4') || version === 'full-beta') {
        await GPT4.execute(context);
      } else {
        await GPT3.execute(context);
      }

      context.chatHistory.removeActivity(activityId);
    } catch (error) {
      ToastLayer.showError(error);
      context.chatHistory.clearActivities();
    }
  }
};

export const FUNCTION_CODE_CONTEXT = `###Instructions###
You are writing Noodl Javascript functions with the following rules:
Inputs follow "Inputs[InputName]" format and are read-only. 

Outputs follow "Outputs[OutputName] = value" format, and variables don't store outputs. 

Signals are sent using "Outputs.SignalName()" without passing values. 

Inputs and Outputs are global, and const should use Noodl inputs with OR operator and default value. 

Call "Success" or "Failure" output signals accordingly. 

Inputs and outputs can have human-readable string names. 

Do not explain each input and output outside the code block.

Functions can use resources from a CDN and access APIs with "fetch." For API handling, make API keys inputs, throw an error for invalid keys, add queries as inputs, and send primitive values to outputs.

Write helpful comments in the code block, so anyone can understand the code.

###Example###
\`\`\`javascript
const city = Inputs.City || 'Malmö';
if (!city) return;

const apiKey = Inputs.ApiKey || '';
if (!apiKey) throw new Error('Invalid API key');
const url = \`https://api.openweathermap.org/data/2.5/weather?q=\${city}&appid=\${apiKey}\`;

try {
  const response = await fetch(url);
  const data = await response.json();
  Outputs.Temperature = data.main.temp;
  Outputs.Success();
} catch (error) {
  Outputs.error = error;
  Outputs.Failure();
}
\`\`\`

###Task###
ONLY respond with javascript code following the instructions and starting and ending with \`\`\`
`;

export const FUNCTION_CODE_CONTEXT_EDIT = `###Instructions###
You are writing Noodl Javascript functions with the following rules:
Inputs follow "Inputs[InputName]" format and are read-only. 

Outputs follow "Outputs[OutputName] = value" format, and variables don't store outputs. 

Signals are sent using "Outputs.SignalName()" without passing values. 

Inputs and Outputs are global, and const should use Noodl inputs with OR operator and default value. 

Call "Success" or "Failure" output signals accordingly. 

Inputs and outputs can have human-readable string names. 

Do not explain each input and output outside the code block.

Functions can use resources from a CDN and access APIs with "fetch." For API handling, make API keys inputs, throw an error for invalid keys, add queries as inputs, and send primitive values to outputs.

Write helpful comments in the code block, so anyone can understand the code.

We are starting from this code and will only modify it:
\`\`\`
%{code}%
\`\`\`

###Task###
ONLY respond with javascript code following the instructions and starting and ending with \`\`\`
`;

export const FUNCTION_CODE_EXPLAIN = (enableSuggestions: boolean) => {
  return `###Context###
- This function is a Function node in Noodl.
- We are currently inside a Component with this node created, the node have the function inside.
- All the variables from the Inputs object is defined on the node as inputs which can be set via the properties on input connection.
- All the variables on the Outputs object is defined on the node as outputs which can be connected to another node.
- Do not show code blocks.

###Instructions###
Analyse the function and create an explanation${
    enableSuggestions ? ' and a maximum of 3 follow-up questions related to the code' : ''
  }.

###Explanation###
Explain with 2-5 sentences what the function does.
- Always include the property names of the Inputs and Outputs objects.
- Always format the property names of the Inputs like this: <Input>input name</Input>
- Always format the property names of the Outputs like this: <Output>output name</Output>

###Label###
Create a label that summarises what the function does.

###Example###
<label>Data To Excel</label>
<explain>
This function converts a JSON data array to an Excel file and initiates a download.

It takes <Input>Data</Input> and <Input>FileName</Input> as inputs, creates a new workbook and worksheet using the XLSX library, converts the JSON data to a sheet, and appends the sheet to the workbook.

It then converts the workbook to a binary string, creates a Blob, and generates a download link. Finally, it triggers the <Output>Success</Output> output signal after the download is initiated.

If the request is successful, it triggers the Outputs.Success output signal.

If there's an error, it sets the Outputs.error output and triggers the Outputs.Failure output signal.
</explain>
${
  enableSuggestions
    ? `<question>What is the format of the required JSON data array?</question>
<question>How do I connect this node to other nodes in my Noodl project?</question>
<question>Are there any limitations or required libraries for this function to work properly?</question>`
    : ''
}

###Task###
Respond only with this specific format, and nothing else:
<label>The label</label>
<explain>
Markdown text.
</explain>
${enableSuggestions ? '<question>Maximum of 3 follow-up questions</question>' : ''}`;
};

export const FUNCTION_CODE_EXPLAIN_PROMPT = (question: string, answer: string, code: string) => {
  return `I got this information with the code, is there something important here that I should think about? Include this in the <explain> element, starting with a new paragraph.

user: ""${question}""
assistant: ""
${answer}
""

###Current code###
\`\`\`
${code}
\`\`\`
`;
};

export const FUNCTION_CODE_QUESTION = () => {
  return `###Context###
- This function is a Function node in Noodl.
- We are currently inside a Component with this node created, the node have the function inside.
- All the variables from the Inputs object is defined on the node as inputs which can be set via the properties on input connection.
- All the variables on the Outputs object is defined on the node as outputs which can be connected to another node.

###Current code###
\`\`\`
%{code}%
\`\`\`
`;
};
