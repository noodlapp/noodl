import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';

import { AiCopilotContext } from '@noodl-models/AiAssistant/AiCopilotContext';
import { NodeGraphModel, NodeGraphNode, NodeGraphNodeJSON } from '@noodl-models/nodegraphmodel';
import { NodeLibrary } from '@noodl-models/nodelibrary';
import { ProjectModel } from '@noodl-models/projectmodel';
import { UndoActionGroup, UndoQueue } from '@noodl-models/undo-queue-model';
import { guid } from '@noodl-utils/utils';

import { makeImageGenerationRequest, saveImageDataToDisk } from './utils';

type UICommandOptions = {
  allowImageNode?: boolean;
  allowImageGeneration?: boolean;
  nodeGraphModel?: NodeGraphModel;
};

export async function handleUICommand(
  prompt: string,
  statusCallback: (status: string) => void,
  options?: UICommandOptions
) {
  const selectedNodes = NodeGraphContextTmp.nodeGraph.getSelectedNodes();
  let parentModel = selectedNodes[0]?.model;
  const nodeGraphModel = options.nodeGraphModel || NodeGraphContextTmp.nodeGraph.model;

  // HACK: To support custom node graph model
  if (options.nodeGraphModel) {
    parentModel = null;
  }

  if (!parentModel || !parentModel.type.allowChildrenWithCategory?.includes('Visual')) {
    //find a root that can add the nodes as children
    parentModel = nodeGraphModel.roots.find((root) => root.type.allowChildrenWithCategory?.includes('Visual'));
  }

  const components = ProjectModel.instance.components.filter((c) =>
    c.graph.commentsModel.getComments().some((c) => c.text.toLowerCase().startsWith('ai:'))
  );

  const comments = ProjectModel.instance.components.flatMap((c) => c.graph.commentsModel.getComments());

  const uiPrimer = comments.find((c) => c.text.toLowerCase().startsWith('ai ui primer:'))?.text;

  const userComponents = components.map((c) => {
    const comment = c.graph.commentsModel.getComments().find((c) => c.text.toLowerCase().startsWith('ai:'));
    const description = comment.text.substring(3).trim();

    return {
      name: c.localName.toLowerCase().replaceAll(' ', '-'),
      fullName: c.fullName,
      description,
      canHaveChildren: c.allowChildrenWithCategory?.includes('Visual')
    };
  });

  statusCallback('Generating nodes');

  const messages = [
    { role: 'system', content: generatePrimer({ ...options, userComponents, uiPrimer }) },
    { role: 'user', content: prompt }
  ];

  const ctx = new AiCopilotContext(null, null, null);

  const undoGroup = new UndoActionGroup({ label: 'AI: Generate nodes' });

  const callbacks = {
    onTagOpen(tagName: string, attributes: Record<string, string>) {
      const json: NodeGraphNodeJSON = {
        type: attributes.componentName ? transformComponentName(attributes.componentName) : transformName(tagName),
        parameters: {},
        children: [],
        x: 0,
        y: 0,
        id: guid()
      };

      const type = NodeLibrary.instance.getNodeTypeWithName(json.type);
      const allPortNames = new Set(type.ports.map((p) => p.name));

      const portMap = new Map<string, string>();
      for (const portName of allPortNames.values()) {
        portMap.set(portName.replaceAll(' ', '').toLowerCase(), portName);
      }

      for (const attr of Object.keys(attributes)) {
        if (attr === 'nodeLabel') {
          json.label = attributes[attr];
        }
        if (attr === 'variant') {
          json.variant = attributes[attr];
        } else {
          let portName = attr;
          // ports can have spaces, but xml attributes can't
          // so if the attribute doesn't match a port, try again but without spaces
          if (!allPortNames.has(portName)) {
            const n = portName.replaceAll(' ', '').toLowerCase();
            if (portMap.has(n)) {
              portName = portMap.get(n);
            }
          }

          json.parameters[portName] = getAttributeValue(portName, attributes[attr]);
        }
      }

      setDefaultValues(json);

      const node = NodeGraphNode.fromJSON(json);
      if (parentModel) {
        parentModel.addChild(node, { undo: undoGroup, disableSelect: true });
      } else {
        nodeGraphModel.addRoot(node, { undo: undoGroup, disableSelect: true });
      }

      parentModel = node;

      if (node.findPortWithName('src')) {
        if (attributes.prompt) {
          makeImageGenerationRequest(attributes.prompt)
            .then((imageData) => saveImageDataToDisk(imageData))
            .then((url) => node.setParameter('src', url));
        } else {
          const width = attributes.width || 100;
          const height = attributes.height || 100;
          const url = `https://via.placeholder.com/${width}x${height}`;
          node.setParameter('src', url);
        }
      }
    },
    onTagEnd() {
      parentModel = parentModel.parent;
    }
  };

  await ctx.chatStreamXml({
    messages: messages,
    provider: {
      model: 'gpt-4',
      // The next context doesnt work with GPT-3.5
      temperature: 0.1
    },
    ...callbacks
  });

  UndoQueue.instance.push(undoGroup);
}

type PrimerOptions = {
  allowImageNode?: boolean;
  allowImageGeneration?: boolean;
  userComponents: {
    name: string;
    fullName: string;
    description: string;
    canHaveChildren: boolean;
  }[];
  uiPrimer: string;
};

function generatePrimer(options?: PrimerOptions) {
  const userComponentsPrimer = options.userComponents
    .map((c) => {
      return `
${c.name}
${c.description}
The attribute "componentName" must always be set to "${c.fullName}" 
xml: <${c.name} componentName="${c.fullName}" />
${c.canHaveChildren ? 'Can contain children' : 'This element must have no child elements'}
  `;
    })
    .join('\n');

  const primer = `
Format the response as xml using the following elements:

Group
An element that can contain multiple children.
xml: <group>[insert children]</group>
Attributes:
- flexDirection: "column"|"row". Default is column.
- backgroundColor: hex color|"transparent". Default is transparent.
- paddingTop: top padding. Default 0
- paddingBottom: bottom padding. Default 0
- paddingLeft: top padding. Default 0
- paddingRight: bottom padding. Default 0
- borderRadius: corner radius in pixels
Rules:
- Padding is one of the following: 0, 8, 16, 32
- A group with a background color has to have a padding of 16.

Columns
An element that contain groups, one per column.
xml: <columns>[insert children]</columns>
Attributes:
- layoutString: a string that has one value per column, separated by a space. The value is the relative size of the column. Default size is 1.

Text
xml: <text />
Children: not allowed
Attributes:
- text: the text content

Button
xml: <button />
Attributes
- label: the button label

Input
xml: <input />
Children: not allowed
Attributes:
- label: the inputs label
- type: the type of input
- placeholder: placeholder text when no option is selected

Checkbox
xml: <checkbox />
Children: not allowed
- label: the checkbox label
- checked: a boolean. Default is false.

Image
xml: <img />
Attributes:
- src: an url
- width: the width as a number in pixels or %
- height: the height as a number in pixels
- prompt: prompt for OpenAIs image generation describing the picture

Dropdown
xml: <dropdown />
Children: not allowed
Attributes:
- items: an array with options with the format: [{Label: "[label name]", Value: "[value]"}]
- label: the label
- placeholder: placeholder text when no option is selected

All elements above have the following attributes:
- marginTop: top margin. Default 0
- marginBottom: bottom margin. Default 0
- marginLeft: top margin. Default 0
- marginRight: bottom margin. Default 0
- position: "absolute" | "relative". Default is relative.
Rules:
- Margins can be one of the following: 0, 8, 16, 32

Prefer to use these elements:
{userComponentPrimers}

Add a "nodeLabel" attribute to every node with an explanation for why this node was created

Attributes with spaces should be formatted as camelCase, no spaces.

Response only contains XML with the elements listed above. Always start with a group.`;

  return (options.uiPrimer || primer).replace('{userComponentPrimers}', userComponentsPrimer);
}

function transformName(name: string) {
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

  return nameMap[name] ? nameMap[name] : name;
}

function transformComponentName(name: string) {
  const component = ProjectModel.instance.components.find(
    (c) => c.fullName.toLocaleLowerCase() === name.toLocaleLowerCase()
  );

  return component?.fullName || name;
}

function getAttributeValue(name: string, value: string) {
  if (
    [
      'marginTop',
      'marginBottom',
      'marginLeft',
      'marginRight',
      'paddingTop',
      'paddingBottom',
      'paddingLeft',
      'paddingRight',
      'width',
      'height',
      'borderRadius'
    ].indexOf(name) !== -1
  ) {
    if (value === 'auto') {
      return undefined;
    }

    if (value.endsWith('%')) {
      return { value: Number(value.substring(0, value.length - 1)), unit: '%' };
    }

    return { value: Number(value), unit: 'px' };
  } else if (name === 'src' && value === '') {
    return undefined;
  }

  return value;
}

function setDefaultValues(node: NodeGraphNodeJSON) {
  if (node.type === 'Group') {
    node.parameters.sizeMode = 'contentHeight';
  }
  if (node.type === 'Group' && node.parameters.borderRadius) {
    node.parameters.clip = true;
  }
  if (node.type === 'Image') {
    if (node.parameters.height) {
      node.parameters.sizeMode = 'explicit';
    } else {
      node.parameters.sizeMode = 'contentHeight';
    }
    node.parameters.objectFit = 'cover';
  }
  if (node.type === 'net.noodl.controls.options' && node.parameters.label) {
    node.parameters.useLabel = true;
  }
}
