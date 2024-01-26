import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';

import { makeChatRequest } from './utils';

export async function handleSuggestionCommand(prompt: string, statusCallback: (status: string) => void) {
  statusCallback('Generating suggestions...');

  const nodeGraphModel = NodeGraphContextTmp.nodeGraph.model;

  const json = nodeGraphModel.toJSON().roots;

  const group = json.find((x) => x.type === 'Group' || x.type === 'Page');
  if (!group) {
    return;
  }

  function cleanNodes(node) {
    let children;
    if (node.children) {
      children = [];
      for (const c of node.children) {
        children.push(cleanNodes(c));
      }
    }

    return {
      type: getType(node.type),
      children: children,
      parameters: node.parameters
    };
  }

  const cleanNode = cleanNodes(group);

  const p = `
  Suggest ${prompt}
  
  UI:
  ${JSON.stringify(cleanNode, null, 2)}
  `;

  const messages = [
    { role: 'system', content: suggestPrimer },
    { role: 'user', content: p }
  ];

  const response = await makeChatRequest('gpt-4', messages);
  console.log(response);

  return JSON.parse(response.content);
}

const nameMap = {
  columns: 'net.noodl.visual.columns',
  button: 'net.noodl.controls.button',
  group: 'Group',
  text: 'Text',
  input: 'net.noodl.controls.textinput',
  img: 'Image',
  dropdown: 'net.noodl.controls.options',
  checkbox: 'net.noodl.controls.checkbox'
};

function getType(type: string) {
  for (const key in nameMap) {
    if (nameMap[key] === type) {
      return key;
    }
  }

  return type;
}

const suggestPrimer = `
You are a suggestion bot that recommends commands for improving a page in an application.

The pages is described with JSON.

The answer can include the following commands:

Name: Image
Description: generate a single image
Prompt: a prompt for the openai image generation API

Name: UI
Description: add user interface elements like buttons, inputs, groups
Prompt: a short description of an UI

Name: Function:
Description: a javascript function
Prompt: a prompt for GTP that generates a javascript function

Name: Suggestion
Description: Suggest commands from the list above
Prompt: a command and its prompt

Each command takes a prompt for an AI to use.

Only answer with the following JSON format:
[
{
name: 'command name',
description: 'short description why this command is suggested',
prompt: 'a prompt for the command'
]
`;
