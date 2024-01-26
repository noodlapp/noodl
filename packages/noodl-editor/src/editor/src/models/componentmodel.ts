import _ from 'underscore';

import { UndoQueue } from '@noodl-models/undo-queue-model';
import Utils from '@noodl-utils/utils';

import Model from '../../../shared/model';
import { EventDispatcher } from '../../../shared/utils/EventDispatcher';
import { NodeGraphModel, NodeGraphNode } from './nodegraphmodel';
import { NodeGrapPort } from './NodeGraphPort';
import { NodeLibrary } from './nodelibrary';
import { ProjectModel } from './projectmodel';

export type ComponentModelArgs = {
  name: string;
  id: string;
  metadata?: Record<string, any>;
  graph?: NodeGraphModel;
};

export class ComponentModel extends Model {
  name: string;
  id: string;
  graph: NodeGraphModel;
  metadata: ComponentModelArgs['metadata'];
  owner: ProjectModel;

  constructor(args: ComponentModelArgs) {
    super();

    this.name = args.name;
    this.id = args.id;
    this.metadata = args.metadata;

    if (args.graph) {
      this.bindGraph(args.graph);
    }
  }

  static fromJSON(json) {
    const _this = new ComponentModel({
      name: json.name,
      id: json.id,
      metadata: json.metadata,
      graph: NodeGraphModel.fromJSON(json.graph)
    });
    return _this;
  }

  dispose() {
    this.graph.dispose();
  }

  bindGraph(graph: NodeGraphModel) {
    if (this.graph) {
      this.graph.off(this);
      this.graph.owner = null;
    }

    this.graph = graph;
    this.graph.owner = this;

    this.graph.on(
      ['nodePortRenamed'],
      (args) => {
        if (args.model.type.haveComponentPorts) {
          // Ports have changed on a node that exports component ports, notify that this type has changed
          this.notifyListeners('portRenamed', {
            model: this,
            port: this.findPortWithName(args.port.name),
            oldName: args.oldName
          });
        }
      },
      this
    );

    this.notifyListeners('graphModelBound');
  }

  collectAllowedChildCategories() {
    let categories = [];

    this.graph.forEachNode(function (node) {
      if (node.type.haveComponentChildren) categories = _.union(node.type.haveComponentChildren, categories);
    });

    return categories.length > 0 ? categories : undefined;
  }
  // Returns the ports for this components, port types are derrived from connections
  // to any ports on node with the "haveComponentPorts" property
  getPorts(): NodeGrapPort[] {
    const _this = this;
    const inputsMap = {},
      outputsMap = {};

    // Find all nodes in graph that should contribute to component ports
    this.graph.forEachNode(function (node) {
      if (node.type && node.type.haveComponentPorts) {
        // Collect all input ports in the inputs map, also collect all connections and
        // their type
        _.each(node.getPorts('input'), function (p) {
          if (!inputsMap[p.name]) inputsMap[p.name] = { ports: [], connections: [] };
          inputsMap[p.name].ports.push(p);

          node.forAllConnectionsOnThisNode(function (c) {
            if (c.toId === node.id && c.toProperty === p.name) {
              const sourceNode = _this.graph.findNodeWithId(c.fromId);
              const sourcePort = sourceNode.getPort(c.fromProperty, 'output');
              if (sourcePort) inputsMap[p.name].connections.push({ direction: 'from', type: sourcePort.type });
            }
          });
        });

        // Collect all outputs and connections, and default value
        _.each(node.getPorts('output'), function (p) {
          if (!outputsMap[p.name]) outputsMap[p.name] = { ports: [], connections: [] };
          outputsMap[p.name].ports.push(p);

          node.forAllConnectionsOnThisNode(function (c) {
            if (c.fromId === node.id && c.fromProperty === p.name) {
              const targetNode = _this.graph.findNodeWithId(c.toId);
              const targetPort = targetNode.getPort(c.toProperty, 'input');
              if (targetPort)
                outputsMap[p.name].connections.push({
                  direction: 'to',
                  type: targetPort.type,
                  def: targetNode.getParameter(c.toProperty),
                  group: targetPort.group
                });
            }
          });
        });
      }
    });

    function _deriveType(p) {
      if (p.connections.length === 1) return p.connections[0].type;
      // Just one connection, simple get the type
      else if (p.connections.length > 1)
        // Try to figure out a compatible type
        return NodeLibrary.instance.findCompatiblePortType(p.connections);
    }

    function _deriveDef(p) {
      if (p.connections.length === 1) return p.connections[0].def; // Just one connection we can derive the def
    }

    function _deriveGroup(p) {
      let portGroup = _.every(p.ports, function (port) {
        return port.group === undefined || port.group === p.ports[0].group;
      })
        ? p.ports[0].group
        : undefined;
      if (!portGroup && p.connections.length >= 1)
        // If there is no port group, try to get group from connections
        portGroup = _.every(p.connections, function (c) {
          return c.group === undefined || c.group === p.connections[0].group;
        })
          ? p.connections[0].group
          : undefined;

      return portGroup;
    }

    // The port maps now contains all connections to and from the component ports
    // Now go through all ports and derive a type
    const ports = [];
    for (var i in inputsMap) {
      var p = inputsMap[i];

      var type = _deriveType(p);
      if (type == undefined) type = '*';

      ports.push({
        name: i,
        type: type,
        default: _deriveDef(p),
        group: _deriveGroup(p),
        plug: 'output',
        index: p.ports[0].index
      });
    }

    for (var i in outputsMap) {
      var p = outputsMap[i];

      var type = _deriveType(p);
      if (type == undefined) type = '*';

      ports.push({
        name: i,
        type: type,
        default: _deriveDef(p),
        group: _deriveGroup(p),
        plug: 'input',
        index: p.ports[0].index
      });
    }

    ports.sort(function (a, b) {
      return a.index - b.index;
    });

    return ports;
  }

  // Generate new Ids for component and it's nodes so it doesn't
  // collide with previous imports of this component
  rekeyAllIds() {
    this.id = this.id || Utils.guid();
    this.graph.rekeyAllIds();
  }

  // Update all references to components that start with the oldPathPrefix
  // to instead start with newPathPrefix (used when duplicating folders...)
  rerouteComponentRefs(oldPathPrefix, newPathPrefix) {
    this.graph.rerouteComponentRefs(oldPathPrefix, newPathPrefix);
  }

  // Returns a port with the given name
  findPortWithName(portname): NodeGrapPort {
    const ports = this.getPorts();
    for (const i in ports) if (ports[i].name === portname) return ports[i];
  }

  // Rename the component
  rename(newname, args?) {
    const _this = this;

    const oldName = this.name;
    this.name = newname;
    this.notifyListeners('renamed', { model: this, oldName });

    // The component is a type, so tell the node library that this has been renamed
    NodeLibrary.instance.typeRenamed(this, oldName);

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: args.label,
        do: function () {
          _this.rename(newname);
        },
        undo: function () {
          _this.rename(oldName);
        }
      });
    }
  }

  getCreateStatus(args: { parent?: TSFixme; type: TSFixme /* ComponentModel */ }) {
    // Woooo... feedback
    if (args.type === this) {
      return { creatable: false, message: 'A component cannot contain an instance of itself.' };
    }

    // Check for circular references
    const _this = this;
    let circular = false;
    function traverseTypes(c) {
      if (!(c instanceof ComponentModel)) return;
      if (c === _this) {
        circular = true;
        return;
      }
      c.graph.forEachNode(function (n) {
        traverseTypes(n.type);
      });
    }
    traverseTypes(args.type);
    if (circular) {
      return { creatable: false, message: 'A circular reference is detected, cannot create node.' };
    }

    // Parents can only contain child nodes
    if (args.parent && args.type) {
      if (
        !args.parent.type.allowChildrenWithCategory ||
        !args.type.category ||
        args.parent.type.allowChildrenWithCategory.indexOf(args.type.category) === -1
      ) {
        return { creatable: false, message: 'This node cannot be a child of the selected node.' };
      }

      if (!args.type.allowAsChild) {
        return { creatable: false, message: 'This node cannot be a child.' };
      }
    }

    // Deprecated
    if (args.type && args.type.deprecated) {
      return { creatable: false, message: 'This node is deprected.' };
    }

    return { creatable: true };
  }

  // The label for component type instances are simply the local type name
  labelForNode(_node) {
    return this.localName;
  }
  // The module for the component is the owner
  getModule() {
    return this.owner;
  }

  // Iterates over all nodes in the component graph
  forEachNode(callback: (node: NodeGraphNode) => boolean | void): boolean {
    return this.graph.forEachNode(callback);
  }

  forEachNodeRecursive(callback: (node: NodeGraphNode) => boolean | void): boolean {
    return this.graph.forEachNodeRecursive(callback);
  }

  getNodes(): NodeGraphNode[] {
    const nodes = [];
    this.graph.forEachNode((node) => {
      nodes.push(node);
    });
    return nodes;
  }

  getNodesWithType(typename) {
    const nodes = [];
    this.graph.forEachNode((node) => {
      if (node.type.name === typename) nodes.push(node);
    });

    return nodes;
  }

  getNodesWithTypeRecursive(typename) {
    const nodes = [];
    this.graph.forEachNodeRecursive((node) => {
      if (node.type.name === typename) nodes.push(node);
    });

    return nodes;
  }

  setMetaData(key, data) {
    if (!this.metadata) this.metadata = {};

    this.metadata[key] = data;

    this.notifyListeners('metadataChanged', { key, data });
    EventDispatcher.instance.notifyListeners('ComponentModel.metadataChanged', { key, data });
  }

  getMetaData(key) {
    if (!this.metadata) this.metadata = {};

    return this.metadata[key];
  }

  toJSON() {
    const json = {
      name: this.name,
      id: this.id,
      graph: this.graph.toJSON(),
      metadata: this.metadata
    };
    return json;
  }

  get ports() {
    return this.getPorts();
  }

  get category() {
    let category;

    // The component will assume the category of any roots that may act as children
    _.each(this.graph.roots, function (root) {
      if (root.type.allowAsChild) category = root.type.category;
    });

    return category;
  }

  get color() {
    let color;

    // The component will assume the color of any roots that may act as children
    _.each(this.graph.roots, function (root) {
      if (root.type.allowAsChild) color = root.type.color;
    });

    return color ? color : 'default';
  }

  // Is there a root in the component graph that may act as a child
  // in that case the component type may act as a child

  get allowAsChild() {
    return !!_.find(this.graph.roots, function (n) {
      return n.type.allowAsChild;
    });
  }

  // The component can have children if there are nodes with "haveComponentChildren"
  // property, collect all categories and return as an array
  get allowChildrenWithCategory() {
    return this.collectAllowedChildCategories();
  }

  // Is there are component root that may act as export root, in that
  // case instances of this component may act as export root
  get allowAsExportRoot() {
    return !!_.find(this.graph.roots, function (n) {
      return n.type.allowAsExportRoot;
    });
  }

  // Local type name of components are the last component of the path /xxx/yyy -> local name is yyy
  get localName() {
    const path = this.name.split('/');
    return path[path.length - 1];
  }

  // Full name is the full name of the component
  get fullName() {
    return this.name;
  }

  // Display name is local name
  get displayName() {
    return this.localName;
  }
}
