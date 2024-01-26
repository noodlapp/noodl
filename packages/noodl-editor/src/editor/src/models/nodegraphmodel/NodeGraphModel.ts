import { each, some } from 'underscore';

import { CommentsModel } from '@noodl-models/commentsmodel';
import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode, NodeGraphNodeSet } from '@noodl-models/nodegraphmodel';
import { NodeLibrary } from '@noodl-models/nodelibrary';
import { UndoQueue } from '@noodl-models/undo-queue-model';
import { WarningsModel } from '@noodl-models/warningsmodel';
import { guid } from '@noodl-utils/utils';

import Model from '../../../../shared/model';
import { EventDispatcher } from '../../../../shared/utils/EventDispatcher';

export type Connection = {
  fromProperty: string;
  fromId: string;
  toProperty: string;
  toId: string;
  annotation: 'Deleted' | 'Changed' | 'Created' | undefined;
};

type NodeGraphModelJson = {
  roots: TSFixme[];
  visualRoots: string[];
  connections: Connection[];
  comments: NodeGraphModelJson[] | undefined;
};

export class NodeGraphModel extends Model {
  roots: NodeGraphNode[];

  connections: Connection[];
  commentsModel: CommentsModel;
  nodeMap: Map<string, NodeGraphNode>;

  public owner: ComponentModel;
  typeModel: TSFixme;

  private evaluatehealthScheduled: boolean;
  private updateTypesScheduled: boolean;

  constructor(args?) {
    super();

    this.roots = [];

    this.connections = [];
    this.commentsModel = new CommentsModel({ comments: args ? args.comments : [] });

    //keep track of all nodes in a an id=>model map for better findNodeWithId() performance
    this.nodeMap = new Map();

    this.bindModels();
  }

  static fromJSON(json: Partial<NodeGraphModelJson>) {
    const _this = new NodeGraphModel({ comments: json.comments });
    for (const i in json.roots) {
      _this.addRoot(NodeGraphNode.fromJSON(json.roots[i]));
    }

    for (const i in json.connections) {
      _this.addConnection(json.connections[i]);
    }

    return _this;
  }

  dispose() {
    EventDispatcher.instance.off(this);
    NodeLibrary.instance.off(this);
    this.typeModel?.off(this);
    this.removeAllListeners();
  }

  scheduleUpdateTypes() {
    if (this.updateTypesScheduled) {
      return;
    }

    this.updateTypesScheduled = true;

    setTimeout(() => {
      this.updateTypesScheduled = false;
      this.updateTypes();
    }, 1);
  }

  bindModels() {
    // Whenever the node library is modified such that types may be added or removed
    // reset the types of all nodes so that they are re evaluated
    NodeLibrary.instance.on(['typeAdded', 'typeRemoved', 'typeRenamed'], () => this.scheduleUpdateTypes(), this);

    // Globally if a connection is added or removed this can effect inferred port types etc
    // so update types globally
    EventDispatcher.instance.on(
      [
        'Model.connectionAdded',
        'Model.connectionRemoved',
        'Model.portRenamed',
        'Model.parametersChanged',
        'Model.portAdded',
        'Model.portRemoved',
        'Model.instancePortsChanged',
        'Model.portRearranged'
      ],
      () => this.scheduleUpdateTypes(),
      this
    );

    // When a type is renamed, check for port references to that type and update
    NodeLibrary.instance.on(
      ['typeRenamed'],
      (args) => {
        this.forEachNode(function (n) {
          each(n.getPorts(), function (p) {
            // If the node has a reference to that type, update the name
            if (NodeLibrary.nameForPortType(p.type) === 'component' && n.parameters[p.name] === args.oldName) {
              n.parameters[p.name] = args.model.name;
            }
          });
        });

        this.scheduleEvaluateHealth();
      },
      this
    );

    // Must evaluate healths if a new module is registered
    NodeLibrary.instance.on(
      ['moduleRegistered', 'moduleUnregistered', 'libraryUpdated'],
      () => this.scheduleUpdateTypes(),
      this
    );

    // Must update variant
    NodeLibrary.instance.on(
      ['Model.variantAdded', 'Model.variantDeleted', 'Model.variantRenamed'],
      () => this.updateVariantRefs(),
      this
    );
  }

  updateTypes() {
    if (this.owner && this.owner.owner && !NodeLibrary.instance.isModuleRegistered(this.owner.owner)) return; // No need to evaluate if we are not part of a registered module

    this.forEachNode(function (n) {
      n.updateType();
    });

    this.scheduleEvaluateHealth();
  }

  updateVariantRefs() {
    if (this.owner && this.owner.owner && !NodeLibrary.instance.isModuleRegistered(this.owner.owner)) return; // No need to evaluate if we are not part of a registered module

    this.forEachNode(function (n) {
      n.updateVariantRef();
    });

    this.scheduleEvaluateHealth();
  }

  // When a node instances of a ceratain type is used the type
  // is bound, if port names are changed both connections and
  // parameters must be updated
  bindTypeModel(type) {
    const _this = this;

    if (this.typeModel) {
      this.typeModel.off(this);
      this.typeModel = null;
    }

    if (!type) return;

    this.typeModel = type;
    this.typeModel.on(
      'portRenamed',
      function (args) {
        // Rename all parameters for all nodes referencing
        // the component
        const oldName = args.oldName;
        const newName = args.port.name;
        const type = args.model;
        _this.forEachNode(function (n) {
          if (n.type === type) {
            n.parameters[newName] = n.parameters[oldName];
            delete n.parameters[oldName];
          }
        });

        // Loop over all connections in graph
        for (const j in _this.connections) {
          const c = _this.connections[j];

          // This connection is connected to a property of the
          // name that is being changed
          if (c.fromProperty === args.oldName) {
            const fromNode = _this.findNodeWithId(c.fromId);

            if (fromNode.type === type) c.fromProperty = args.port.name;
          }

          if (c.toProperty === args.oldName) {
            const toNode = _this.findNodeWithId(c.toId);

            if (toNode.type === type) c.toProperty = args.port.name;
          }
        }
      },
      this
    );
  }

  rekeyAllIds() {
    const map = {};

    this.nodeMap.clear();

    const rekeyNodes = (nodes) => {
      nodes !== undefined &&
        nodes.forEach((n) => {
          const newId = guid();
          map[n.id] = newId;
          n.id = newId;
          this.nodeMap.set(n.id, n);

          rekeyNodes(n.children);
        });
    };

    rekeyNodes(this.roots);

    this.connections.forEach((con) => {
      con.fromId = map[con.fromId];
      con.toId = map[con.toId];
    });
  }

  rerouteComponentRefs(oldPathPrefix, newPathPrefix) {
    this.forEachNode((n) => {
      n.getPorts().forEach((p) => {
        if (NodeLibrary.nameForPortType(p.type) === 'component' && n.parameters[p.name].startsWith(oldPathPrefix)) {
          const oldPath = n.parameters[p.name];
          n.parameters[p.name] = newPathPrefix + oldPath.substring(oldPathPrefix.length);
        }
      });
    });
  }

  getRoots() {
    return this.roots;
  }

  addRoot(model: TSFixme, args?) {
    const _this = this;

    // Make sure the graph listens to type changes for all types in the sub tree that is added
    model.forEach((m) => {
      this.bindTypeModel(m.type);
      m.owner = this;
      this.nodeMap.set(m.id, m);
    });

    this.roots.push(model);
    this.nodeMap.set(model.id, model);
    this.notifyListeners('nodeAdded', { model: model, disableSelect: args?.disableSelect });

    // Support for undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: args.label,
        do: function () {
          _this.addRoot(model);
        },
        undo: function () {
          _this.removeNode(model);
        }
      });
    }
  }

  removeNode(model, args?) {
    const _this = this;

    // Start by removing all connections to/from this node
    this.removeConnectionsForNode(model, args);

    // When the node is free, remove the node
    const parent = model.parent;
    const index = parent ? parent.children.indexOf(model) : 0;
    if (model.parent) {
      const idx = model.parent.children.indexOf(model);
      if (idx !== -1) {
        model.parent.children.splice(idx, 1);
        model.parent = undefined;
        this.nodeMap.delete(model.id);
        model.forEach((child) => {
          this.nodeMap.delete(child.id);
        });
        this.notifyListeners('nodeRemoved', { model: model });
      }
    } else {
      const idx = this.roots.indexOf(model);
      if (idx !== -1) {
        this.roots.splice(idx, 1);
        this.nodeMap.delete(model.id);
        model.forEach((child) => {
          this.nodeMap.delete(child.id);
        });

        this.notifyListeners('nodeRemoved', { model: model });
      }
    }

    this.owner && WarningsModel.instance.clearWarningsForRef({ component: this.owner, node: model });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: args.label,
        do: function () {
          _this.removeNode(model);
        },
        undo: function () {
          if (parent) parent.insertChild(model, index);
          else _this.addRoot(model);
        }
      });
    }
  }

  removeAllNodes(args) {
    while (this.roots.length > 0) {
      this.removeNode(this.roots[0], args);
    }
  }

  removeConnectionsForNode(model, args) {
    // Remove all connections to and from this node
    for (let i = 0; i < this.connections.length; i++) {
      const con = this.connections[i];
      if (con.fromId === model.id || con.toId === model.id) {
        this.removeConnection(con, args);
        i--;
      }
    }

    // Recurse to children
    for (const i in model.children) {
      this.removeConnectionsForNode(model.children[i], args);
    }
  }

  addConnection(model, args?) {
    const _this = this;

    this.connections.push(model);
    this.notifyListeners('connectionAdded', { model: model });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: args.label,
        do: function () {
          _this.addConnection(model);
        },
        undo: function () {
          _this.removeConnection(model);
        }
      });
    }
  }

  removeConnection(model, args?) {
    const _this = this;

    const idx = this.connections.indexOf(model);
    if (idx !== -1) {
      this.connections.splice(idx, 1);
      this.notifyListeners('connectionRemoved', { model: model });

      this.owner && WarningsModel.instance.clearWarningsForRef({ component: this.owner, connection: model });

      // Undo
      if (args && args.undo) {
        const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

        undo.push({
          label: args.label,
          do: function () {
            _this.removeConnection(model);
          },
          undo: function () {
            _this.addConnection(model);
          }
        });
      }
    }
  }

  getConnectionStatus(args) {
    const _this = this;
    const targetNode = args.targetNode;
    const targetPort = targetNode.getPort(args.targetPort);
    const sourceNode = args.sourceNode;
    const sourcePort = sourceNode.getPort(args.sourcePort);

    // Make sure types are compatible
    if (sourcePort && targetPort) {
      const typesCompatible = NodeLibrary.instance.canCastPortTypes(sourcePort.type, targetPort.type);

      if (!typesCompatible) {
        return {
          connectable: false,
          message:
            'Type mismatch a source port of type <strong>' +
            NodeLibrary.nameForPortType(sourcePort.type) +
            '</strong> cannot be connected to a target port with type <strong>' +
            NodeLibrary.nameForPortType(targetPort.type) +
            '</strong>.'
        };
      }
    }

    // Duplicate connection
    if (sourcePort && targetPort && sourceNode && sourcePort) {
      // TODO: Change "some" to JS equivalent
      const isDuplicate = !!some(this.connections, function (c) {
        return (
          c.toId === targetNode.id &&
          c.toProperty === targetPort.name &&
          c.fromId === sourceNode.id &&
          c.fromProperty === sourcePort.name
        );
      });
      if (isDuplicate) {
        return {
          connectable: false,
          message: 'These ports are already connected in this direction'
        };
      }
    }

    return {
      connectable: true
    };
  }

  getConnectionHealth(c) {
    const sourceId = c.sourceId ? c.sourceId : c.sourceNode.id;
    const targetId = c.targetId ? c.targetId : c.targetNode.id;

    const warnings = WarningsModel.instance.getWarnings({
      component: this.owner,
      connection: {
        fromId: sourceId,
        fromProperty: c.sourcePort,
        toId: targetId,
        toProperty: c.targetPort
      }
    });

    if (warnings) {
      return { healthy: false, message: warnings.shortMessage };
    }

    return { healthy: true };
  }

  scheduleEvaluateHealth() {
    const _this = this;

    if (this.evaluatehealthScheduled) return;
    this.evaluatehealthScheduled = true;

    setTimeout(function () {
      _this.evaluatehealthScheduled && _this.evaluateHealth();
      _this.evaluatehealthScheduled = false;
    }, 2000);
  }

  evaluateHealth() {
    const _this = this;
    if (!NodeLibrary.instance.isLoaded()) return;
    if (!this.owner) return;
    if (!this.owner.owner) return;

    if (!NodeLibrary.instance.isModuleRegistered(this.owner.owner)) return; // This module is not registered in the node library, no need to eval health

    // Nodes
    this.forEachNode(function (n) {
      n.evaluateHealth();
    });

    // Connections
    this.forEachConnection(function (c) {
      _this.evaluateConnectionHealth(c);
    });
  }

  evaluateConnectionHealth(c) {
    if (!this.owner) return; // Not in component

    const sourceNode = this.findNodeWithId(c.fromId);
    const targetNode = this.findNodeWithId(c.toId);

    // Make sure the source and target ports exist
    const sourcePort = sourceNode && c.fromProperty ? sourceNode.getPort(c.fromProperty) : undefined;
    WarningsModel.instance.setWarning(
      { component: this.owner, connection: c, key: 'con-no-source-port' },
      !sourcePort
        ? {
            message: "Source port doesn't exist.",
            showGlobally: true,
            level: 'error'
          }
        : undefined
    );

    const targetPort = targetNode && c.toProperty ? targetNode.getPort(c.toProperty) : undefined;
    WarningsModel.instance.setWarning(
      { component: this.owner, connection: c, key: 'con-no-target-port' },
      !targetPort || !NodeLibrary.instance.isConditionalPortValid(targetNode, c.toProperty, ['extended'])
        ? {
            message: "Target port doesn't exist.",
            showGlobally: true,
            level: 'error'
          }
        : undefined
    );

    // Make sure the ports are connected internally
    WarningsModel.instance.setWarning(
      { component: this.owner, connection: c, key: 'con-no-source-port-type' },
      sourcePort && !sourcePort.type
        ? {
            message: 'The source port is missing type.',
            level: 'error'
          }
        : undefined
    );

    WarningsModel.instance.setWarning(
      { component: this.owner, connection: c, key: 'con-no-target-port-type' },
      targetPort && !targetPort.type
        ? {
            message: 'The target port is missing type.',
            level: 'error'
          }
        : undefined
    );

    // Make sure target and source ports have the same type
    const w =
      targetNode &&
      targetPort &&
      sourceNode &&
      sourcePort &&
      sourcePort.type &&
      targetPort.type &&
      !NodeLibrary.instance.canCastPortTypes(sourcePort.type, targetPort.type);
    WarningsModel.instance.setWarning(
      { component: this.owner, connection: c, key: 'con-type-mismatch' },
      w
        ? {
            message:
              'Target port of type <strong>' +
              NodeLibrary.nameForPortType(targetPort.type) +
              '</strong> cannot be connected to a source port of type <strong>' +
              NodeLibrary.nameForPortType(sourcePort.type) +
              '</strong>',
            level: 'error'
          }
        : undefined
    );
  }

  // Detaches a node from its parent
  detachNode(node, args?) {
    const _this = this;

    const idx = node.parent.children.indexOf(node);
    const parent = node.parent;
    if (idx !== -1) {
      node.parent.children.splice(idx, 1);
      node.parent = undefined;
      this.roots.push(node);
      this.notifyListeners('nodeDetached', { model: node });

      // Undo
      if (args && args.undo) {
        const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

        undo.push({
          label: args.label,
          do: function () {
            _this.detachNode(node);
          },
          undo: function () {
            _this.attachNode(parent, node, idx);
          }
        });
      }
    }
  }

  // Attaches a node to a parent node at a given index
  attachNode(parent, child, index, args?) {
    const _this = this;

    const idx = this.roots.indexOf(child);
    if (idx !== -1) {
      this.roots.splice(idx, 1);
      child.parent = parent;
      parent.children.splice(index, 0, child);
      this.notifyListeners('nodeAttached', { parent, model: child, index: index });

      // Undo
      if (args && args.undo) {
        const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

        undo.push({
          label: args.label,
          do: function () {
            _this.attachNode(parent, child, index);
          },
          undo: function () {
            _this.detachNode(child);
          }
        });
      }
    }
  }

  // Loop over all nodes (roots and children) of the graph
  forEachNode(callback: (node: NodeGraphNode) => boolean | void): boolean {
    for (const i in this.roots) {
      if (this.roots[i].forEach(callback)) {
        return true;
      }
    }

    return false;
  }

  forEachNodeRecursive(callback: (node: NodeGraphNode) => boolean | void): boolean {
    for (const i in this.roots) {
      if (this.roots[i].forEachRecursive(callback)) {
        return true;
      }
    }

    return false;
  }

  // Loop over all connections of the graph
  forEachConnection(callback: (connection: Connection) => void) {
    for (const i in this.connections) {
      callback(this.connections[i]);
    }
  }

  // Check if the graph has nodes with the specific type
  hasNodesWithType(type) {
    let res = false;
    this.forEachNode(function (n) {
      if (type === n.type) {
        res = true;
        return true;
      }
    });
    return res;
  }

  // Find a node with the specified id
  findNodeWithId(id: string) {
    return this.nodeMap.get(id);
  }

  // Return a set of nodes (only the roots that span the specified list of nodes)
  // and internal connections
  getNodeSetWithNodes(nodes) {
    // Generate ID map
    const idMap = {};

    const set = [];
    for (var i in nodes) {
      const n = nodes[i];
      // Only include nodes that are either root nodes or
      // where the parent is not part of the nodes to be included (in this case the node will be included as child)
      if (n.parent === undefined || nodes.indexOf(n.parent) === -1) {
        n.forEach(function (node) {
          idMap[node.id] = true;
        });
        set.push(n);
      }
    }

    // Get all connections that are within the node group
    const connections = [];
    for (var i in this.connections) {
      const c = this.connections[i];
      if (idMap[c.fromId] && idMap[c.toId]) {
        connections.push(c);
      }
    }

    return new NodeGraphNodeSet({ nodes: set, connections: connections });
  }

  // Insert a node set (roots and connections)
  insertNodeSet(nodeset, args) {
    // Add root nodes and children
    for (var i in nodeset.nodes) {
      const n = nodeset.nodes[i];
      this.addRoot(n, args);
    }

    // Add connections
    for (var i in nodeset.connections) {
      const c = nodeset.connections[i];
      this.addConnection(c, args);
    }

    //add comments
    for (const comment of nodeset.comments) {
      this.commentsModel.addComment(comment, args);
    }
  }

  // Remove all nodes and comments in a node set
  // NOTE: This will also remove all connections between any node in the node set and other nodes
  removeNodeSet(nodeset, args) {
    nodeset.parents = [];

    // Simply remove all roots, connections and children will follow
    for (const i in nodeset.nodes) {
      const n = nodeset.nodes[i];

      this.removeNode(n, args);
    }

    for (const comment of nodeset.comments) {
      this.commentsModel.removeComment(comment.id, args);
    }
  }

  getVisualRootIds() {
    return this.roots.filter((root) => root.type.allowAsChild).map((x) => x.id);
  }

  toJSON(): NodeGraphModelJson {
    const json = {
      connections: this.connections,
      roots: this.roots.map((x) => x.toJSON()),
      // Add all the visual nodes to another list,
      // so when we export the project we have all the data we need.
      visualRoots: this.getVisualRootIds(),
      comments: undefined
    };

    const comments = this.commentsModel.getComments();
    if (comments.length) {
      json.comments = comments;
    }

    return json;
  }
}
