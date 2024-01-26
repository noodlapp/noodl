import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import { filesystem } from '@noodl/platform';

import { AiCopilotContext } from '@noodl-models/AiAssistant/AiCopilotContext';
import { aiNodeTemplates } from '@noodl-models/AiAssistant/AiTemplates';
import { ChatHistory, ChatHistoryEvent } from '@noodl-models/AiAssistant/ChatHistory';
import { AiNodeTemplate, AiNodeTemplateType } from '@noodl-models/AiAssistant/interfaces';
import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphModel, NodeGraphNode, NodeGraphNodeSet } from '@noodl-models/nodegraphmodel';
import { ProjectModel } from '@noodl-models/projectmodel';
import { Model } from '@noodl-utils/model';
import { guid } from '@noodl-utils/utils';

import { EventDispatcher } from '../../../../shared/utils/EventDispatcher';
import { PopupItemType } from '../../views/Clippy/ClippyCommandsMetadata';
import { ToastLayer } from '../../views/ToastLayer/ToastLayer';

const docsTemplates = [
  {
    label: 'Read from database',
    desc: 'Create a node that queries the database, filters and returns the results.',
    examples: [
      'Get all users that belong to the "Vendor" group',
      'Get all products, sort from lowest to highest price',
      'Get all unread messages for the currently logged in user'
    ],
    primer: 'query.md',
    prefix: 'const query = Noodl.Records.query;\n',
    template: 'function-query-database'
  },
  {
    label: 'Fetch REST API',
    desc: 'Create a node that connects to an external REST API via a HTTP request and performs an action.',
    examples: ['Get the main image from a wikipedia page', 'List the songs in a playlist in spotify'],
    primer: 'rest.md',
    template: 'rest'
  },
  {
    label: 'Form Validation',
    desc: 'Specify inputs and how you want them validated, the outputs are any validations and errors.',
    examples: ['Validate a phone number and email'],
    primer: 'validation.md',
    template: 'function-form-validation'
  },
  {
    label: 'AI Function',
    desc: 'Create a function node that performs a task when you trigger Run, it can have inputs and outputs.',
    examples: [
      'Create inputs for Array1 and Array2 and output all items with the same ID',
      'Get a random number between the min and max inputs',
      'Get the current location of the device'
    ],
    primer: 'function.md',
    template: 'function'
  },
  {
    label: 'Write to database',
    desc: '',
    examples: [],
    template: 'function-crud'
  },
  {
    label: '',
    desc: '',
    examples: [],
    template: 'chart'
  }
];

export type AiTemplate = {
  id: string;
  type: AiNodeTemplateType;
  nodeName: string;
  templateId: string;
  template: AiNodeTemplate;
  name: string;
  description: string;
  examples: string[];
  promptUrl: string;
};

export enum AiAssistantEvent {
  ProcessingUpdated,
  ActivityUpdated
}

export type AiAssistantEvents = {
  [AiAssistantEvent.ProcessingUpdated]: (nodeId: string) => void;
  [AiAssistantEvent.ActivityUpdated]: () => void;
};

export interface AiActivityItem {
  id: string;
  type: PopupItemType;
  title: string;
  prompt: string;
  node?: any;
  graph?: ComponentModel;
}

async function deprecated_getAiDirPath() {
  const relative = '.noodl/ai';
  const path = filesystem.resolve(ProjectModel.instance._retainedProjectDirectory, relative);
  if (!filesystem.exists(path)) {
    await filesystem.makeDirectory(path);
  }
  return path;
}

export class AiAssistantModel extends Model<AiAssistantEvent, AiAssistantEvents> {
  public static instance = new AiAssistantModel();

  public templates: AiTemplate[] = docsTemplates.map(
    (x): AiTemplate => ({
      id: x.label,
      type: aiNodeTemplates[x.template]?.type,
      nodeName: aiNodeTemplates[x.template]?.name,
      templateId: x.template,
      template: aiNodeTemplates[x.template],
      name: x.label,
      description: x.desc,
      examples: x.examples || [],
      promptUrl: null
    })
  );

  private _contexts: Record<string, AiCopilotContext> = {};

  public activities: AiActivityItem[] = [];

  constructor() {
    super();

    const _self = this;
    EventDispatcher.instance.on(
      ['Model.nodeRemoved'],
      function ({ args }: { args: { model: NodeGraphNode }; model: NodeGraphModel }) {
        const nodeId = args.model.id;
        if (_self._contexts[nodeId]) {
          _self._contexts[nodeId].abortController.abort('node deleted');
          delete _self._contexts[nodeId];
        }
      },
      this
    );
  }

  public addActivity({ id, type, title, prompt, node, graph }: AiActivityItem) {
    this.activities.push({ id, type, title, prompt, node, graph });
    this.notifyListeners(AiAssistantEvent.ActivityUpdated);
  }

  public removeActivity(id: AiActivityItem['id']) {
    const activityTitle = this.activities.find((item) => item.id === id).title;
    this.activities = this.activities.filter((item) => item.id !== id);
    this.notifyListeners(AiAssistantEvent.ActivityUpdated);
    ToastLayer.showInteraction(`AI finished the ${activityTitle} activity`);
  }

  /**
   * @returns A list of all Node ids that are currently getting processed.
   */
  public getProcessingNodeIds(): string[] {
    return Object.keys(this._contexts).filter((x) => this._contexts[x].chatHistory.activities.length > 0);
  }

  public async createContext(node: NodeGraphNode) {
    const aiAssistant = node.metadata.AiAssistant;
    if (!aiAssistant) {
      throw 'This node is not an AI node.';
    }

    if (this._contexts[node.id]) {
      return this._contexts[node.id];
    }

    const chatHistory = ChatHistory.fromJSON(node.metadata.prompt);

    // Backwards compatibility, load the AI file and fetch the template.
    if (node.metadata.AiAssistant && !node.metadata.prompt) {
      try {
        const path = await deprecated_getAiDirPath();
        const filePath = filesystem.resolve(path, node.metadata.AiAssistant);
        if (filesystem.exists(filePath)) {
          const json = await filesystem.readJson(filePath);
          const messages = json.history || [];
          messages.forEach((message) => {
            chatHistory.add(message);
          });
          chatHistory.metadata.templateId = json.metadata.templateId;
          // NOTE: Keeping this since it is used in other places to define it as AI node
          node.metadata.AiAssistant = 'moved';
          node.metadata.prompt = chatHistory.toJSON();
          node.notifyListeners('metadataChanged', { key: 'prompt', data: node.metadata.prompt });
          await filesystem.removeFile(filePath);
        }
      } catch (error) {
        console.error('Failed to load old AI file.', error);
      }
    }

    // HACK: It is loading it twice...
    if (this._contexts[node.id]) {
      return this._contexts[node.id];
    }

    chatHistory.on(ChatHistoryEvent.ActivitiesChanged, () => {
      this.notifyListeners(AiAssistantEvent.ProcessingUpdated, node.id);
    });

    const template = this.templates.find((x) => x.templateId === chatHistory.metadata.templateId);
    if (!template) {
      throw 'Template not found';
    }

    const context = new AiCopilotContext(template, chatHistory, node);
    this._contexts[node.id] = context;

    return context;
  }

  public async send(context: AiCopilotContext) {
    await context.template.template.onMessage(
      // Send it as an object so the methods are bound to this class.
      context.toObject(),
      context.chatHistory.messages.length > 0
        ? context.chatHistory.messages[context.chatHistory.messages.length - 1]
        : null
    );

    // Save the chat history
    context.node.metadata.prompt = context.chatHistory.toJSON();
  }

  public async createNode(templateId: string, parentModel: NodeGraphNode, pos: TSFixme) {
    function createNodes(nodeset: NodeGraphNodeSet, pos?: TSFixme, parentModel?: NodeGraphNode, toastMessage?: string) {
      const nodes: NodeGraphNode[] = [];
      if (parentModel) {
        for (const node of nodeset.nodes) {
          parentModel.addChild(node);
          nodes.push(node);
        }
      } else {
        const nodeGraph = NodeGraphContextTmp.nodeGraph;
        const insertedNodeset = nodeGraph.insertNodeSet({
          nodeset: nodeset,
          x: pos.x,
          y: pos.y,
          toastMessage
        });
        for (const node of insertedNodeset.nodes) {
          nodes.push(node);
        }
      }
      return nodes;
    }

    const template = this.templates.find((x) => x.templateId === templateId);
    if (!template) {
      throw 'Template not found';
    }

    const metadata: Record<string, unknown> = {
      prompt: new ChatHistory([], { templateId }).toJSON(),
      AiAssistant: 'old'
    };

    //hack: nodes that are of type 'green' will get a color override to the node color theme 'data'
    let color: NodeColor;
    switch (template.type) {
      case 'green':
        color = 'data';
        break;
    }
    if (color) {
      metadata.colorOverride = color;
    }

    if (template.template.nodeDisplayName) {
      metadata.typeLabelOverride = template.template.nodeDisplayName;
    }

    const nodeset = new NodeGraphNodeSet({
      nodes: [
        NodeGraphNode.fromJSON({
          id: guid(),
          label: template.name,
          type: template.nodeName,
          x: 0,
          y: 0,
          metadata
        })
      ],
      connections: []
    });

    // NOTE: This will create a clone of the nodeset, so the ids will be changed
    const insertedNodes = createNodes(nodeset, pos, parentModel, `Created AI Node`);
    // HACK: Expect only one node back
    return this.createContext(insertedNodes[0]);
  }

  //clears all the context, important when closing a project
  resetContexts() {
    this._contexts = {};
  }
}
