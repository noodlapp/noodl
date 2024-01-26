import { ComponentModel } from '@noodl-models/componentmodel';
import { Connection, NodeGraphModel, NodeGraphNode, NodeGraphNodeSet } from '@noodl-models/nodegraphmodel';
import { ProjectModel } from '@noodl-models/projectmodel';
import { UndoQueue, UndoActionGroup } from '@noodl-models/undo-queue-model';

import { NodeGraphEditorNode } from '../views/nodegrapheditor/NodeGraphEditorNode';
import { guid, Rectangle } from './utils';

type ConnectionInfo = {
  connection: Connection;
  portName: string; //name of the component input or output port
};

function flattenTree(roots: readonly NodeGraphEditorNode[]) {
  const nodes = new Set<NodeGraphEditorNode>();

  function addSubtree(node: NodeGraphEditorNode) {
    nodes.add(node);
    for (const child of node.children) {
      addSubtree(child);
    }
  }

  roots.forEach(addSubtree);

  return Array.from(nodes);
}

export function extractToComponent(
  projectModel: ProjectModel,
  nodeGraphModel: NodeGraphModel,
  nodeset: NodeGraphNodeSet,
  selectedNodes: readonly NodeGraphEditorNode[],
  newNodePosition: { x: number; y: number }
) {
  const undoGroup = new UndoActionGroup({ label: 'extract to component' });

  const name = generateName(projectModel, nodeGraphModel);

  const component = new ComponentModel({
    name,
    graph: new NodeGraphModel(),
    id: guid()
  });

  //get the parent of one of the visual nodes so we know where to place the new component instace
  const firstNodeWithParent = getFirstNodeWithExternalParent(selectedNodes);
  const parent = firstNodeWithParent?.parent;
  const childIndex = parent?.children.indexOf(firstNodeWithParent);

  //get all nodes, including children
  const selectedNodesAndChildren = flattenTree(selectedNodes);

  //figure out which connections needs to move to component inputs and outputs
  const [componentInputs, componentOutputs] = collectComponentInputsAndOutputs(
    nodeGraphModel,
    selectedNodesAndChildren
  );

  //remove the nodes we're extracting
  nodeGraphModel.removeNodeSet(nodeset, { undo: undoGroup });

  //set the origin of the nodes to 0,0
  const originalOrigin = nodeset.getOriginPosition();
  undoGroup.pushAndDo({
    do() {
      nodeset.setOriginPosition({ x: 0, y: 0 });
    },
    undo() {
      nodeset.setOriginPosition(originalOrigin);
    }
  });

  //and add them to the new component
  component.graph.insertNodeSet(nodeset, { undo: undoGroup });

  //connect the component input and output nodes
  connectComponentInputsAndOutputs(component, componentInputs, componentOutputs, undoGroup);

  //add the new component to the project
  projectModel.addComponent(component, { undo: undoGroup });

  //create an instance of the new component...
  const node = NodeGraphNode.fromJSON({
    type: name,
    id: guid(),
    x: newNodePosition.x,
    y: newNodePosition.y
  });

  if (parent) {
    parent.model.insertChild(node, childIndex, { undo: undoGroup });
  } else {
    nodeGraphModel.addRoot(node, { undo: undoGroup });
  }

  connectExternalInputsAndOutputs(nodeGraphModel, node, componentInputs, componentOutputs, undoGroup);

  UndoQueue.instance.push(undoGroup);
}

export function canExtractToComponent(
  nodeGraphModel: NodeGraphModel,
  selectedNodes: readonly NodeGraphEditorNode[]
): { allow: boolean; reason?: string } {
  //can't extract siblings since they would require a new parent which could change behavior, so don't allow it
  const parents = getParents(selectedNodes);
  if (parents.length > 1) {
    return { allow: false, reason: 'Nodes that are siblings must have have their parent selected' };
  }

  //extracting component and outputs nodes aren't implemented (but would be fairly straight forward to do)
  const hasComponentInputs = selectedNodes.some((node) => node.model.typename === 'Component Inputs');
  if (hasComponentInputs) {
    return { allow: false, reason: 'Extracting a Component Inputs node is unsupported' };
  }

  const hasComponentOutputs = selectedNodes.some((node) => node.model.typename === 'Component Outputs');
  if (hasComponentOutputs) {
    return { allow: false, reason: 'Extracting a Component Outputs node is unsupported' };
  }

  return { allow: true };
}

//Get all parents. Exclude parents that are part of the nodes array (so a hiererachy of nodes won't include "internal" parents)
function getParents(nodes: readonly NodeGraphEditorNode[]) {
  const parents = [];

  for (const node of nodes) {
    if (node.parent && !nodes.includes(node.parent)) {
      parents.push(node.parent);
    }
  }

  return parents;
}

function getFirstNodeWithExternalParent(nodes: readonly NodeGraphEditorNode[]) {
  for (const node of nodes) {
    if (node.parent && !nodes.includes(node.parent)) {
      return node;
    }
  }

  return null;
}

function collectComponentInputsAndOutputs(nodeGraphModel: NodeGraphModel, nodes: NodeGraphEditorNode[]) {
  const inputs: ConnectionInfo[] = [];
  const outputs: ConnectionInfo[] = [];

  const extractedNodeIds = new Set(Array.from(nodes.values()).map((node) => node.id));
  nodeGraphModel.forEachConnection((c) => {
    if (extractedNodeIds.has(c.fromId) && !extractedNodeIds.has(c.toId)) {
      //get the display name of the port to make the component port names nicer
      const port = nodeGraphModel.findNodeWithId(c.toId).findPortWithName(c.toProperty);
      const portName = port.displayName || c.toProperty;

      outputs.push({ connection: c, portName });
    } else if (!extractedNodeIds.has(c.fromId) && extractedNodeIds.has(c.toId)) {
      const port = nodeGraphModel.findNodeWithId(c.toId).findPortWithName(c.toProperty);
      const portName = port.displayName || c.toProperty;

      inputs.push({ connection: c, portName });
    }
  });

  //group all connection that can share one conneciton
  //e.g. two connection that both trigger the same output should have one component output and not two
  const inputGroups: Record<string, ConnectionInfo[]> = {};
  for (const input of inputs) {
    const id = input.connection.fromId + input.connection.fromProperty;
    if (!inputGroups[id]) {
      inputGroups[id] = [];
    }
    inputGroups[id].push(input);
  }

  const outputGroups: Record<string, ConnectionInfo[]> = {};
  for (const output of outputs) {
    const id = output.connection.toId + output.connection.toProperty;
    if (!outputGroups[id]) {
      outputGroups[id] = [];
    }
    outputGroups[id].push(output);
  }

  //make sure connection groups doesn't have name collisions
  resolveNameCollisions(Object.values(inputGroups));
  resolveNameCollisions(Object.values(outputGroups));

  return [inputs, outputs];
}

function resolveNameCollisions(groups: ConnectionInfo[][]) {
  const nameCounter: Record<string, number> = {};

  for (const group of groups) {
    const portName = group[0].portName;

    if (!nameCounter[portName]) {
      nameCounter[portName] = 1;
    } else {
      nameCounter[portName]++;
    }

    const count = nameCounter[portName];
    if (count > 1) {
      group.forEach((connectionInfo) => (connectionInfo.portName = portName + ' ' + count));
    }
  }
}

function connectComponentInputsAndOutputs(
  component: ComponentModel,
  inputs: ConnectionInfo[],
  outputs: ConnectionInfo[],
  undoGroup: UndoActionGroup
) {
  if (inputs.length) {
    const componentInput = NodeGraphNode.fromJSON({
      type: 'Component Inputs',
      id: guid(),
      ...getComponentInputsPosition(component, inputs.length),
      ports: inputs.map((input) => ({
        name: input.portName,
        plug: 'output',
        type: {
          name: '*'
        }
      }))
    });

    component.graph.addRoot(componentInput, { args: undoGroup });
    for (const input of inputs) {
      const c = {
        fromId: componentInput.id,
        fromProperty: input.portName,
        toId: input.connection.toId,
        toProperty: input.connection.toProperty
      };
      component.graph.addConnection(c, { undo: undoGroup });
    }
  }

  //outputs
  if (outputs.length) {
    const componentOutput = NodeGraphNode.fromJSON({
      type: 'Component Outputs',
      id: guid(),
      ...getComponentOutputsPosition(component, outputs.length),
      ports: outputs.map((output) => ({
        name: output.portName,
        plug: 'input',
        type: {
          name: '*'
        }
      }))
    });

    component.graph.addRoot(componentOutput, { args: undoGroup });
    for (const output of outputs) {
      const c = {
        fromId: output.connection.fromId,
        fromProperty: output.connection.fromProperty,
        toId: componentOutput.id,
        toProperty: output.portName
      };
      component.graph.addConnection(c, { undo: undoGroup });
    }
  }
}

function connectExternalInputsAndOutputs(
  nodeGraphModel: NodeGraphModel,
  node: NodeGraphNode,
  inputs: ConnectionInfo[],
  outputs: ConnectionInfo[],
  undoGroup: UndoActionGroup
) {
  //add connections to component inputs
  for (const input of inputs) {
    nodeGraphModel.addConnection(
      {
        fromId: input.connection.fromId,
        fromProperty: input.connection.fromProperty,
        toId: node.id,
        toProperty: input.portName
      },
      { undo: undoGroup }
    );
  }

  //and outputs
  for (const output of outputs) {
    nodeGraphModel.addConnection(
      {
        fromId: node.id,
        fromProperty: output.portName,
        toId: output.connection.toId,
        toProperty: output.connection.toProperty
      },
      { undo: undoGroup }
    );
  }
}

function generateName(projectModel: ProjectModel, nodeGraphModel: NodeGraphModel) {
  let name: string;
  let i = 1;

  do {
    name = nodeGraphModel.owner.fullName + '/Extracted component' + (i > 1 ? ' ' + i : '');
    i++;
  } while (projectModel.getComponentWithName(name));

  return name;
}

function getComponentInputsPosition(component: ComponentModel, numOutputs: number) {
  const aabb = getAABBForNodesAndCommentsIntersecting(
    component,
    0,
    200 + numOutputs * NodeGraphEditorNode.propertyConnectionHeight
  );
  return { x: aabb.minX - NodeGraphEditorNode.size.width - 100, y: 100 };
}

function getComponentOutputsPosition(component: ComponentModel, numInputs: number) {
  const aabb = getAABBForNodesAndCommentsIntersecting(
    component,
    0,
    200 + numInputs * NodeGraphEditorNode.propertyConnectionHeight
  );
  return { x: aabb.maxX + 100, y: 100 };
}

function getAABBForNodesAndCommentsIntersecting(component: ComponentModel, minY: number, maxY: number) {
  const comments = component.graph.commentsModel.getComments() as Rectangle[];
  const nodes = component.getNodes();

  const rects = comments.concat(
    nodes.map((node) => {
      const nodeSize = NodeGraphEditorNode.size; //this is just the start size so height is likely incorrect. Good enough for our purposes here
      return {
        x: node.x,
        y: node.y,
        width: nodeSize.width,
        height: nodeSize.height
      };
    })
  );

  const aabb = {
    minX: Number.MAX_VALUE,
    maxX: -Number.MAX_VALUE,
    minY: Number.MAX_VALUE,
    maxY: -Number.MAX_VALUE
  };

  const rectsInBounds = rects.filter(
    (r) => (r.y >= minY && r.y <= maxY) || (r.y + r.height >= minY && r.y + r.height <= maxY)
  );

  for (const rect of rectsInBounds) {
    if (rect.x < aabb.minX) {
      aabb.minX = rect.x;
    }
    if (rect.x + rect.width > aabb.maxX) {
      aabb.maxX = rect.x + rect.width;
    }
    if (rect.y < aabb.minY) {
      aabb.minY = rect.y;
    }
    if (rect.y + rect.height > aabb.maxY) {
      aabb.maxY = rect.y + rect.height;
    }
  }

  return aabb;
}
