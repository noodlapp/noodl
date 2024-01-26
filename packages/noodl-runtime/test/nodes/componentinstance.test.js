const ComponentInstance = require('./componentinstance');
const { ComponentModel } = require('../models/componentmodel');
const GraphModel = require('../models/graphmodel');
const NodeContext = require('../nodecontext');
const ComponentInputs = require('./componentinputs');
const ComponentOutputs = require('./componentoutputs');
const NodeDefinition = require('../nodedefinition');

async function setupComponent() {
  const context = new NodeContext();
  context.nodeRegister.register(NodeDefinition.defineNode(ComponentInputs.node));
  context.nodeRegister.register(NodeDefinition.defineNode(ComponentOutputs.node));

  const componentModel = await ComponentModel.createFromExportData({
    name: 'testComponent',
    id: 'loltroll2',
    nodes: [
      {
        id: 'loltroll',
        type: 'Component Inputs',
        ports: [{ name: 'textInput', plug: 'output', type: 'string' }]
      },
      {
        id: 'componentOutputs',
        type: 'Component Outputs',
        ports: [{ name: 'textOutput', plug: 'input', type: 'string' }]
      }
    ],
    ports: [
      { name: 'textInput', plug: 'input', type: 'string' },
      { name: 'textOutput', plug: 'output', type: 'string' }
    ],
    connections: []
  });

  const componentInstance = new ComponentInstance(context);
  await componentInstance.setComponentModel(componentModel);
  return { componentInstance, componentModel };
}

function createTestNodeDefinition() {
  return NodeDefinition.defineNode({
    name: 'Test Node',
    category: 'test',
    initialize() {
      this.inputHistory = [];
    },
    inputs: {
      input: {
        type: 'string',
        set(value) {
          this.testValue = value;
          this.flagOutputDirty('output');
          this.inputHistory.push(value);
        }
      }
    },
    outputs: {
      output: {
        type: 'string',
        get() {
          return this.testValue;
        }
      }
    }
  });
}

test('Component inputs are registered', async () => {
  const { componentInstance } = await setupComponent();
  expect(componentInstance.hasInput('textInput')).toBeTruthy();
});

test('Internal component inputs are removed when a component input node is removed', async () => {
  const { componentInstance, componentModel } = await setupComponent();

  expect(componentInstance._internal.componentInputs.length).toBe(1);
  await componentModel.removeNodeWithId('loltroll');
  expect(componentInstance._internal.componentInputs.length).toBe(0);
});

test('Component outputs are registered', async () => {
  const { componentInstance } = await setupComponent();
  expect(componentInstance.hasOutput('textOutput')).toBeTruthy();
});

test('Internal component outputs are removed when a component output node is removed', async () => {
  const { componentInstance, componentModel } = await setupComponent();

  expect(componentInstance._internal.componentOutputs.length).toBe(1);
  await componentModel.removeNodeWithId('componentOutputs');
  expect(componentInstance._internal.componentOutputs.length).toBe(0);
});

test('Parameters should be overwritten by connections', async () => {
  const context = new NodeContext();

  context.nodeRegister.register(createTestNodeDefinition());

  const componentModel = await ComponentModel.createFromExportData({
    name: 'rootComponent',
    id: 'testid',
    nodes: [
      {
        id: 'testNodeEnd',
        type: 'Test Node',
        parameters: { input: 'param-value' }
      },
      {
        id: 'testNodeStart',
        type: 'Test Node',
        parameters: { input: 'connection-value' }
      }
    ],
    connections: [{ sourceId: 'testNodeStart', sourcePort: 'output', targetId: 'testNodeEnd', targetPort: 'input' }]
  });

  const componentInstance = new ComponentInstance(context);
  await componentInstance.setComponentModel(componentModel);

  const testnodeEnd = componentInstance.nodeScope.getNodeWithId('testNodeEnd');
  testnodeEnd.update();

  expect(testnodeEnd.inputHistory.length).toBe(1);
  expect(testnodeEnd.inputHistory[0]).toBe('connection-value');
});

test('Component inputs should not interfere with internal nodes', async () => {
  const context = new NodeContext();

  context.nodeRegister.register(NodeDefinition.defineNode(ComponentInputs.node));
  context.nodeRegister.register(createTestNodeDefinition());

  const componentModel = await ComponentModel.createFromExportData({
    name: 'rootComponent',
    id: 'testid',
    nodes: [
      {
        id: 'testnode',
        type: 'Test Node',
        parameters: { input: 'param-value' }
      },
      {
        id: 'compinput',
        type: 'Component Inputs',
        ports: [{ name: 'output', plug: 'output', type: 'string' }]
      }
    ],
    connections: [{ sourceId: 'compinput', sourcePort: 'output', targetId: 'testnode', targetPort: 'input' }]
  });

  const componentInstance = new ComponentInstance(context);
  await componentInstance.setComponentModel(componentModel);

  const testnode = componentInstance.nodeScope.getNodeWithId('testnode');
  testnode.update();

  expect(testnode.inputHistory.length).toBe(1);
  expect(testnode.inputHistory[0]).toBe('param-value');
});

test('No delays in component inputs and outputs', async () => {
  const context = new NodeContext();

  context.nodeRegister.register(NodeDefinition.defineNode(ComponentInputs.node));
  context.nodeRegister.register(NodeDefinition.defineNode(ComponentOutputs.node));
  context.nodeRegister.register(createTestNodeDefinition());

  const graph = new GraphModel();

  graph.on('componentAdded', (component) => context.registerComponentModel(component));

  await graph.importEditorData({
    components: [
      {
        name: 'testComponent',
        nodes: [
          {
            id: 'compinput',
            type: 'Component Inputs',
            ports: [{ name: 'textInput', plug: 'output', type: 'string' }]
          },
          {
            id: 'testnode-inner',
            type: 'Test Node',
            parameters: { input: 'inner-value' }
          },
          {
            id: 'compoutput',
            type: 'Component Outputs',
            ports: [{ name: 'textOutput', plug: 'input', type: 'string' }]
          }
        ],
        connections: [
          { sourceId: 'compinput', sourcePort: 'textInput', targetId: 'testnode-inner', targetPort: 'input' },
          { sourceId: 'testnode-inner', sourcePort: 'output', targetId: 'compoutput', targetPort: 'textOutput' }
        ],
        ports: [
          { name: 'textInput', plug: 'input', type: 'string' },
          { name: 'textOutput', plug: 'output', type: 'string' }
        ]
      },
      {
        name: 'rootComponent',
        nodes: [
          {
            id: 'testComponent',
            type: 'testComponent'
          },
          {
            id: 'testnodeEnd',
            type: 'Test Node'
          },
          {
            id: 'testNodeStart',
            type: 'Test Node',
            parameters: { input: 'outer-value' }
          }
        ],
        connections: [
          { sourceId: 'testComponent', sourcePort: 'textOutput', targetId: 'testnodeEnd', targetPort: 'input' },
          { sourceId: 'testNodeStart', sourcePort: 'output', targetId: 'testComponent', targetPort: 'textInput' }
        ]
      }
    ]
  });

  const rootComponent = await context.createComponentInstanceNode('rootComponent');
  context.setRootComponent(rootComponent);

  const testnodeEnd = rootComponent.nodeScope.getNodeWithId('testnodeEnd');
  const testnodeInner = rootComponent.nodeScope.getNodesWithIdRecursive('testnode-inner')[0];

  context.update();

  expect(testnodeEnd.inputHistory.length).toBe(1);
  expect(testnodeEnd.inputHistory[0]).toBe('outer-value');

  expect(testnodeInner.inputHistory.length).toBe(1);
  expect(testnodeInner.inputHistory[0]).toBe('outer-value');
});
