'use strict';

const guid = require('./guid');

function NodeScope(context, componentOwner) {
  this.context = context;
  this.nodes = {};
  this.componentOwner = componentOwner; //Component Instance that owns this NodeScope
  this.componentInstanceChildren = {};
}

function verifyData(data, requiredKeys) {
  requiredKeys.forEach(function (key) {
    if (!data[key]) {
      throw new Error('Missing ' + key);
    }
  });
}

NodeScope.prototype.addConnection = function (connectionData) {
  try {
    verifyData(connectionData, ['sourceId', 'sourcePort', 'targetId', 'targetPort']);
  } catch (e) {
    throw new Error('Error in connection: ' + e.message);
  }

  try {
    var sourceNode = this.getNodeWithId(connectionData.sourceId),
      targetNode = this.getNodeWithId(connectionData.targetId);

    targetNode.registerInputIfNeeded(connectionData.targetPort);
    sourceNode.registerOutputIfNeeded(connectionData.sourcePort);
    targetNode.connectInput(connectionData.targetPort, sourceNode, connectionData.sourcePort);
  } catch (e) {
    console.error(e.message);
  }
};

NodeScope.prototype.setNodeParameters = function (node, nodeModel) {
  const variant = this.context.variants.getVariant(nodeModel.type, nodeModel.variant);

  if (variant) {
    //apply the variant (this will also apply the parameters)
    node.setVariant(variant);
  } else {
    const parameters = nodeModel.parameters;

    var inputNames = Object.keys(parameters);

    if (this.context.nodeRegister.hasNode(node.name)) {
      var metadata = this.context.nodeRegister.getNodeMetadata(node.name);
      inputNames.sort(function (a, b) {
        var inputA = metadata.inputs[a];
        var inputB = metadata.inputs[b];
        return (inputB ? inputB.inputPriority : 0) - (inputA ? inputA.inputPriority : 0);
      });
    }

    inputNames.forEach((inputName) => {
      node.registerInputIfNeeded(inputName);

      //protect against obsolete parameters
      if (node.hasInput(inputName) === false) {
        return;
      }

      node.queueInput(inputName, parameters[inputName]);
    });
  }
};

NodeScope.prototype.createNodeFromModel = async function (nodeModel, updateOnDirtyFlagging) {
  if (nodeModel.type === 'Component Children') {
    if (nodeModel.parent) {
      var parentInstance = this.getNodeWithId(nodeModel.parent.id);
      this.componentOwner.setChildRoot(parentInstance);
    }
    return;
  }

  var node;
  try {
    node = await this.createNode(nodeModel.type, nodeModel.id);
    node.updateOnDirtyFlagging = updateOnDirtyFlagging === false ? false : true;
    node.setNodeModel(nodeModel);
  } catch (e) {
    console.error(e.message);
    if (this.context.editorConnection && this.context.isWarningTypeEnabled('nodescope')) {
      this.context.editorConnection.sendWarning(this.componentOwner.name, nodeModel.id, 'nodelibrary-unknown-node', {
        message: e.message,
        showGlobally: true
      });
    }
    return;
  }

  if (nodeModel.variant && node.setVariant) node.setVariant(nodeModel.variant);
  this.setNodeParameters(node, nodeModel);

  if (nodeModel.parent) {
    this.insertNodeInTree(node, nodeModel);
  }

  return node;
};

NodeScope.prototype.insertNodeInTree = function (nodeInstance, nodeModel) {
  var parentInstance = this.getNodeWithId(nodeModel.parent.id);
  var childIndex = nodeModel.parent.children.indexOf(nodeModel);

  if (!parentInstance.addChild) {
    throw new Error(
      'Node ' + parentInstance.id + ' of type ' + parentInstance.constructor.name + " can't have children"
    );
  }

  parentInstance.addChild(nodeInstance, childIndex);
};

NodeScope.prototype.getNodeWithId = function (id) {
  if (this.nodes.hasOwnProperty(id) === false) {
    throw new Error('Unknown node id ' + id);
  }
  return this.nodes[id];
};

NodeScope.prototype.hasNodeWithId = function (id) {
  return this.nodes.hasOwnProperty(id);
};

NodeScope.prototype.createPrimitiveNode = function (name, id, extraProps) {
  if (!id) id = guid();

  if (this.nodes.hasOwnProperty(id)) {
    throw Error('duplicate id ' + id);
  }

  const node = this.context.nodeRegister.createNode(name, id, this);
  if (extraProps) {
    for (const prop in extraProps) {
      node[prop] = extraProps[prop];
    }
  }

  this.nodes[id] = node;
  return node;
};

NodeScope.prototype.createNode = async function (name, id, extraProps) {
  if (!id) id = guid();

  if (this.nodes.hasOwnProperty(id)) {
    throw Error('duplicate id ' + id);
  }

  let node;

  if (this.context.nodeRegister.hasNode(name)) {
    node = this.context.nodeRegister.createNode(name, id, this);
    if (extraProps) {
      for (const prop in extraProps) {
        node[prop] = extraProps[prop];
      }
    }
  } else {
    node = await this.context.createComponentInstanceNode(name, id, this, extraProps);
    this.componentInstanceChildren[id] = node;
  }

  this.nodes[id] = node;
  return node;
};

NodeScope.prototype.getNodesWithIdRecursive = function (id) {
  var ComponentInstanceNode = require('./nodes/componentinstance');

  function findNodesWithIdRec(scope, id, result) {
    if (scope.nodes.hasOwnProperty(id)) {
      result.push(scope.nodes[id]);
    }

    var componentIds = Object.keys(scope.nodes).filter(function (nodeId) {
      return scope.nodes[nodeId] instanceof ComponentInstanceNode;
    });

    componentIds.forEach(function (componentId) {
      findNodesWithIdRec(scope.nodes[componentId].nodeScope, id, result);
    });
  }

  var result = [];
  findNodesWithIdRec(this, id, result);
  return result;
};

NodeScope.prototype.getNodesWithType = function (name) {
  var self = this;
  var ids = Object.keys(this.nodes).filter(function (id) {
    return self.nodes[id].name === name;
  });
  return ids.map(function (id) {
    return self.nodes[id];
  });
};

NodeScope.prototype.getNodesWithTypeRecursive = function (name) {
  var ComponentInstanceNode = require('./nodes/componentinstance');

  var self = this;
  function findNodesWithTypeRec() {
    result = result.concat(self.getNodesWithType(name));

    var componentIds = Object.keys(self.nodes).filter(function (nodeId) {
      return self.nodes[nodeId] instanceof ComponentInstanceNode;
    });

    componentIds.forEach(function (componentId) {
      var res = self.nodes[componentId].nodeScope.getNodesWithTypeRecursive(name);
      result = result.concat(res);
    });
  }

  var result = [];
  findNodesWithTypeRec(result);
  return result;
};

NodeScope.prototype.getAllNodesRecursive = function () {
  var ComponentInstanceNode = require('./nodes/componentinstance');

  let result = [];

  const getAllNodesRec = () => {
    result = result.concat(Object.values(this.nodes));

    var componentIds = Object.keys(this.nodes).filter((nodeId) => {
      return this.nodes[nodeId] instanceof ComponentInstanceNode;
    });

    componentIds.forEach((componentId) => {
      var res = this.nodes[componentId].nodeScope.getAllNodesRecursive();
      result = result.concat(res);
    });
  };

  getAllNodesRec(result);
  return result;
};

NodeScope.prototype.getAllNodesWithVariantRecursive = function (variant) {
  const nodes = this.getAllNodesRecursive();
  return nodes.filter((node) => node.variant === variant);
};

NodeScope.prototype.onNodeModelRemoved = function (nodeModel) {
  var nodeInstance = this.getNodeWithId(nodeModel.id);

  if (nodeModel.parent) {
    var parentInstance = this.getNodeWithId(nodeModel.parent.id);
    parentInstance.removeChild(nodeInstance);
  }

  nodeInstance._onNodeDeleted();
  delete this.nodes[nodeInstance.id];
  delete this.componentInstanceChildren[nodeInstance.id];
};

NodeScope.prototype.removeConnection = function (connectionModel) {
  var targetNode = this.getNodeWithId(connectionModel.targetId);
  targetNode.removeInputConnection(connectionModel.targetPort, connectionModel.sourceId, connectionModel.sourcePort);
};

NodeScope.prototype.setComponentModel = async function (componentModel) {
  this.componentModel = componentModel;

  const nodes = [];

  //create all nodes
  for (const nodeModel of componentModel.getAllNodes()) {
    const node = await this.createNodeFromModel(nodeModel, false);
    if (node) nodes.push(node);
  }

  componentModel.getAllConnections().forEach((conn) => this.addConnection(conn));

  //now that all nodes and connections are setup, trigger the dirty flagging so nodes can run with all the connections in place
  nodes.forEach((node) => (node.updateOnDirtyFlagging = true));

  nodes.forEach((node) => {
    if (node._dirty) {
      node._performDirtyUpdate();
    }
  });

  componentModel.on('connectionAdded', (conn) => this.addConnection(conn), this);
  componentModel.on('connectionRemoved', this.removeConnection, this);
  componentModel.on('nodeAdded', this.createNodeFromModel, this);

  var self = this;
  componentModel.on(
    'nodeParentWillBeRemoved',
    function (nodeModel) {
      if (nodeModel.type === 'Component Children') {
        if (nodeModel.parent) {
          this.componentOwner.setChildRoot(null);
        }
        return;
      }

      const nodeInstance = self.getNodeWithId(nodeModel.id);
      if (nodeInstance.parent) {
        nodeInstance.parent.removeChild(nodeInstance);
      }
    },
    this
  );

  componentModel.on(
    'nodeParentUpdated',
    function (nodeModel) {
      if (nodeModel.type === 'Component Children') {
        var parentInstance = this.getNodeWithId(nodeModel.parent.id);
        this.componentOwner.setChildRoot(parentInstance);
      } else {
        var nodeInstance = self.getNodeWithId(nodeModel.id);
        self.insertNodeInTree(nodeInstance, nodeModel);
      }
    },
    this
  );

  componentModel.on(
    'nodeRemoved',
    function (nodeModel) {
      if (nodeModel.type !== 'Component Children') {
        self.onNodeModelRemoved(nodeModel);
      }
    },
    this
  );

  for (const id in this.nodes) {
    const node = this.nodes[id];
    node.nodeScopeDidInitialize && node.nodeScopeDidInitialize();
  }
};

NodeScope.prototype.reset = function () {
  if (this.componentModel) {
    this.componentModel.removeListenersWithRef(this);
    this.componentModel = undefined;
  }

  Object.keys(this.nodes).forEach((id) => {
    if (this.nodes.hasOwnProperty(id)) {
      this.deleteNode(this.nodes[id]);
    }
  });
};

NodeScope.prototype.deleteNode = function (nodeInstance) {
  if (this.nodes.hasOwnProperty(nodeInstance.id) === false) {
    console.error("Node doesn't belong to this scope", nodeInstance.id, nodeInstance.name);
    return;
  }

  if (nodeInstance.parent) {
    nodeInstance.parent.removeChild(nodeInstance);
  }

  //depth first
  if (nodeInstance.getChildren) {
    nodeInstance.getChildren().forEach((child) => {
      nodeInstance.removeChild(child);
      //the child might be created in a different scope
      //if the child is a component instance, we want its parent scope, not the inner scope
      const nodeScope = child.parentNodeScope || child.nodeScope;
      nodeScope.deleteNode(child);
    });
  }

  if (this.componentModel) {
    const connectionFrom = this.componentModel.getConnectionsFrom(nodeInstance.id);
    const connectionTo = this.componentModel.getConnectionsTo(nodeInstance.id);

    connectionFrom.concat(connectionTo).forEach((connection) => {
      if (this.nodes.hasOwnProperty(connection.targetId) && this.nodes.hasOwnProperty(connection.sourceId)) {
        this.removeConnection(connection);
      }
    });
  }

  nodeInstance._onNodeDeleted();
  delete this.nodes[nodeInstance.id];
  delete this.componentInstanceChildren[nodeInstance.id]; //in case this is a component
};

NodeScope.prototype.sendEventFromThisScope = function (eventName, data, propagation, sendEventInThisScope, _exclude) {
  if (sendEventInThisScope) {
    var eventReceivers = this.getNodesWithType('Event Receiver').filter(function (eventReceiver) {
      return eventReceiver.getChannelName() === eventName;
    });

    for (var i = 0; i < eventReceivers.length; i++) {
      var consumed = eventReceivers[i].handleEvent(data);
      if (consumed) return true;
    }
  }

  if (propagation === 'parent' && this.componentOwner.parentNodeScope) {
    // Send event to parent scope
    //either the scope of the visual parent if there is one, otherwise the parent component
    const parentNodeScope = this.componentOwner.parent
      ? this.componentOwner.parent.nodeScope
      : this.componentOwner.parentNodeScope;
    if (!parentNodeScope) return;
    parentNodeScope.sendEventFromThisScope(eventName, data, propagation, true);
  } else if (propagation === 'children') {
    // Send event to all child scopes
    var nodes = this.nodes;
    for (var nodeId in nodes) {
      var children = nodes[nodeId].children;
      if (children)
        children.forEach((child) => {
          if (child.name && this.context.hasComponentModelWithName(child.name)) {
            // This is a component instance child
            var consumed = child.nodeScope.sendEventFromThisScope(eventName, data, propagation, true);
            if (consumed) return true;
          }
        });
    }
  } else if (propagation === 'siblings') {
    // Send event to all siblings, that is all children of the parent scope except this scope
    let parentNodeScope;
    if (this.componentOwner.parent) {
      parentNodeScope = this.componentOwner.parent.nodeScope;
    } else {
      parentNodeScope = this.componentOwner.parentNodeScope;
    }

    if (!parentNodeScope) return;

    var nodes = parentNodeScope.nodes;
    for (var nodeId in nodes) {
      var children = nodes[nodeId].children;
      if (children) {
        var _c = children.filter(
          (child) => child.name && this.context.hasComponentModelWithName(child.name) && child.nodeScope !== this
        );
        _c.forEach((child) => {
          var consumed = child.nodeScope.sendEventFromThisScope(eventName, data, null, true);
          if (consumed) return true;
        });
      }
    }
  }

  return false;
};

module.exports = NodeScope;
