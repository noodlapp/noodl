import { each, filter, find, isEqual, some } from 'underscore';

import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphModel } from '@noodl-models/nodegraphmodel/NodeGraphModel';
import { NodeGrapPort } from '@noodl-models/NodeGraphPort';
import { NodeLibrary } from '@noodl-models/nodelibrary';
import { BasicNodeType } from '@noodl-models/nodelibrary/BasicNodeType';
import { UnknownNodeType } from '@noodl-models/nodelibrary/UnknownNodeType';
import { UndoActionGroup, UndoQueue } from '@noodl-models/undo-queue-model';
import { WarningsModel } from '@noodl-models/warningsmodel';

import Model from '../../../../shared/model';

export type NodeGraphNodeParameters = {
  [key: string]: any;
};

export type RootNodeType = ComponentModel | BasicNodeType | UnknownNodeType;

export interface NodeGraphNodeJSON {
  id: string;
  x: number;
  y: number;
  label?: TSFixme;
  type: string;
  variant?: TSFixme;
  version?: TSFixme;
  parameters?: TSFixme;
  stateParameters?: TSFixme;
  stateTransitions?: TSFixme;
  defaultStateTransitions?: TSFixme;
  ports?: TSFixme;
  dynamicports?: TSFixme;
  conflicts?: TSFixme;
  annotation?: TSFixme;
  metadata?: TSFixme;
  diffData?: TSFixme;
  children?: TSFixme[];
}

type DynamicPortsOptions = {
  detectRenamed?: TSFixme[];
  renamed: {
    plug: 'input' | 'output';
    after: string;
    before: string;
    patterns: string[];
  }[];
};

export class NodeGraphNode extends Model {
  parameters: NodeGraphNodeParameters;
  children: NodeGraphNode[];
  ports: NodeGrapPort[];
  dynamicports: NodeGrapPort[];

  public owner: NodeGraphModel;

  id: string;
  stateParameters: TSFixme;
  parent: NodeGraphNode;
  conflicts: TSFixme;
  stateTransitions: TSFixme;
  defaultStateTransitions: TSFixme;
  version: number;
  x: number;
  y: number;
  variantName: string;
  typename: string;
  diffData: TSFixme; //this is set by the project differ, otherwise unused
  annotation?: 'Deleted' | 'Created' | 'Changed'; //this is set by the project differ, otherwise unused
  metadata?: Record<string, any>;

  private _variant: TSFixme;
  private _label: TSFixme;
  private _type: TSFixme;
  private _ports: TSFixme;

  public get variant(): TSFixme {
    if (!this._variant) {
      this._variant = NodeLibrary.instance.findVariant(this.variantName, this.type);
    }
    return this._variant;
  }

  public set variant(value: string | { name: string }) {
    if (typeof value === 'string') this.variantName = value;
    else if (value !== undefined) {
      this._variant = value;
      this.variantName = value.name;
    } else {
      this._variant = this.variantName = undefined;
    }
    this.notifyListeners('variantChanged', { variant: this._variant });
  }

  /** Get the type for this node */
  public get type() /*: NodeLibraryNodeType */ {
    if (!this._type) {
      this._type = NodeLibrary.instance.getNodeTypeWithName(this.typename);
      this.owner && this.owner.bindTypeModel(this._type);
    }

    // If no type is found return an "unkown node type" instead of undefined
    return this._type ? this._type : NodeLibrary.instance.getUnknownNodeType(this.typename);
  }

  public set type(value: TSFixme) {
    if (typeof value === 'string') this.typename = value;
    else this._type = value;
  }

  /** Get the label of the node */
  public get label() {
    if (!this._label) return this.type.labelForNode(this);
    return this._label;
  }

  /** Set the label of the node */
  public set label(value: string) {
    this._label = value;
    this.notifyListeners('labelChanged');
  }

  constructor(args) {
    super();

    for (const i in args) this[i] = args[i];
    if (!this.parameters) this.parameters = {};
    if (!this.children) this.children = [];
    if (!this.ports) this.ports = [];
    if (!this.dynamicports) this.dynamicports = [];
  }

  static fromJSON(json: NodeGraphNodeJSON): NodeGraphNode {
    const node = new NodeGraphNode({
      id: json.id,
      x: json.x,
      y: json.y,
      label: json.label,
      type: json.type,
      variant: json.variant,
      version: json.version,
      parameters: json.parameters,
      stateParameters: json.stateParameters,
      stateTransitions: json.stateTransitions,
      defaultStateTransitions: json.defaultStateTransitions,
      ports: json.ports,
      dynamicports: json.dynamicports,
      conflicts: json.conflicts,
      annotation: json.annotation,
      metadata: json.metadata,
      diffData: json.diffData
    });
    for (const i in json.children) {
      const child = NodeGraphNode.fromJSON(json.children[i]);
      node.addChild(child);
    }
    return node;
  }

  // Return the module that this node belongs to
  getModule() {
    if (this.owner && this.owner.owner) return this.owner.owner.owner; // graph->component->project
  }

  // This method is called by the graph when a potential change in available node
  // types occurs
  updateType() {
    const newType = NodeLibrary.instance.getNodeTypeWithName(this.typename);
    if (newType !== undefined && this._type !== newType) {
      // There is a new type for the type name, use it instead
      this._type = newType;
      this.owner && this.owner.bindTypeModel(this._type); // Register the new type
    }

    // The node type may have changed location in the project
    if (!NodeLibrary.instance.typeIsMissing(this._type)) {
      // If the type is healthy make sure to keep the type name up to date
      this.typename = this._type.name;
    }

    // Reset ports cache so they will be reloaded
    this._ports = undefined;
  }

  // Loop over this node and all children
  forEach(callback: (node: NodeGraphNode) => boolean | void): boolean {
    if (callback(this)) {
      return true;
    }

    for (const i in this.children) {
      if (this.children[i].forEach(callback)) {
        return true;
      }
    }

    return false;
  }

  forEachRecursive(callback: (node: NodeGraphNode) => boolean | void): boolean {
    if (callback(this)) {
      return true;
    }

    if (this.type instanceof ComponentModel) {
      const res = (this.type as ComponentModel).forEachNodeRecursive(callback);
      if (res) {
        return true;
      }
    }

    for (const i in this.children) {
      if (this.children[i].forEachRecursive(callback)) {
        return true;
      }
    }

    return false;
  }

  // Checks if the port with the given name of this node is connected from/to in
  // the graph
  isPortConnected(portname, type?) {
    const _this = this;
    return !!some(this.owner.connections, function (c) {
      return (
        ((!type || type === 'source') && c.fromId === _this.id && c.fromProperty === portname) ||
        ((!type || type === 'target') && c.toId === _this.id && c.toProperty === portname)
      );
    });
  }

  // Iterates over all connections to or from this node
  forAllConnectionsOnThisNode(
    callback: (connection: { fromId: string; fromProperty: string; toId: string; toProperty: string }) => void
  ) {
    const _this = this;
    each(this.owner.connections, function (c) {
      if (c.fromId === _this.id || c.toId === _this.id) callback(c);
    });
  }

  getConnectionsOnThisNode(): { fromId: string; fromProperty: string; toId: string; toProperty: string }[] {
    return this.owner.connections.filter((c) => c.fromId === this.id || c.toId === this.id);
  }

  // A node may have instance ports
  // Add a port to the component
  addPort(port: NodeGrapPort, args?) {
    const _this = this;

    if (
      find(this.ports, function (p) {
        return p.name === port.name;
      })
    )
      return false;

    this._ports = undefined; // Clear cache
    this.ports.push(port);
    this.notifyListeners('portAdded', { model: this, port: port });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      const portname = port.name;
      undo.push({
        label: args.label,
        do: function () {
          _this.addPort(port);
        },
        undo: function () {
          _this.removePortWithName(portname);
        }
      });
    }
  }

  findPortWithName(portname: string): NodeGrapPort {
    return this.getPort(portname);
  }

  // Arrange port index and group
  arrangePort(portname: string, index: number, group: string, args?) {
    const _this = this;
    const port = find(this.ports, function (p) {
      return p.name === portname;
    });
    if (!port) return;
    if (port.group === group && port.index === index) return;

    const oldGroup = port.group;
    const oldIndex = port.index;

    port.group = group;
    port.index = index;

    // Notify
    this.notifyListeners('portRearranged', { model: this, port: port, oldIndex: oldIndex, oldGroup: oldGroup });
    this.owner &&
      this.owner.notifyListeners('nodePortRearranged', {
        model: this,
        port: port,
        oldIndex: oldIndex,
        oldGroup: oldGroup
      });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: args.label,
        do: function () {
          _this.arrangePort(portname, index, group);
        },
        undo: function () {
          _this.arrangePort(portname, oldIndex, oldGroup);
        }
      });
    }

    this._ports = undefined; // Clear cache
  }

  // Rename a port
  renamePortWithName(portname: string, newname: string, args?) {
    const _this = this;

    if (
      find(this.ports, function (p) {
        return p.name === newname;
      })
    )
      return false;

    const port = find(this.ports, function (p) {
      return p.name === portname;
    });

    // Dynamic ports before the rename was made
    //var before = NodeLibrary.instance.getDynamicPortsForNode(this);
    this._ports = undefined; // Clear cache
    port.name = newname;

    // Dynamic ports after
    //var after = NodeLibrary.instance.getDynamicPortsForNode(this);
    // Find all dynamic ports that have been renamed and copy parameter values
    /*function findPortWithNameInList(list,name) {
      for(var i = 0; i < list.length; i++)
        if(list[i].name === name) return true;
    }
  
    if(before && after) {
      for(var i = 0; i < before.length; i++) {
        var oldPortname = before[i].name;
       if(oldPortname.indexOf(portname)===0 && !findPortWithNameInList(after,oldPortname)) {
          // A dynamic port have been removed, has it been renamed?
          var newPortname = newname + oldPortname.substring(portname.length);
          if(findPortWithNameInList(after,newPortname)) {
            // It has been renamed, we need to copy the values
            this.parameters[newPortname] = this.parameters[oldPortname];
            delete this.parameters[oldPortname];
          }
        }
      }
    }*/
    // Find all connections that use this port
    // and rename them
    const graph = this.owner;
    for (const i in graph.connections) {
      const c = graph.connections[i];

      if (c.fromProperty === portname && c.fromId === this.id) {
        var oldProperty = c.fromProperty;
        c.fromProperty = newname;
        graph.notifyListeners('connectionPortChanged', { model: c, oldFromProperty: oldProperty });
      } else if (c.toProperty === portname && c.toId === this.id) {
        var oldProperty = c.toProperty;
        c.toProperty = newname;
        graph.notifyListeners('connectionPortChanged', { model: c, oldToProperty: oldProperty });
      }
    }

    // Notify
    this.notifyListeners('portRenamed', { model: this, port: port, oldName: portname });
    this.owner && this.owner.notifyListeners('nodePortRenamed', { model: this, port: port, oldName: portname });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: args.label,
        do: function () {
          _this.renamePortWithName(portname, newname);
        },
        undo: function () {
          _this.renamePortWithName(newname, portname);
        }
      });
    }

    return true;
  }

  // Remove the port with the specified name
  // The port cannot be removed if it is connected internally
  removePortWithName(portname, args?) {
    const _this = this;

    if (this.isPortConnected(portname) && !args?.force) return false;

    this._ports = undefined; // Clear cache
    const port = find(this.ports, function (p) {
      return p.name === portname;
    });
    const idx = this.ports.indexOf(port);
    if (idx !== -1) {
      this.ports.splice(idx, 1);
      this.notifyListeners('portRemoved', { model: this, port: port });

      // Undo
      if (args && args.undo) {
        const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

        undo.push({
          label: args.label,
          do: function () {
            _this.removePortWithName(portname);
          },
          undo: function () {
            _this.addPort(port);
          }
        });
      }
      return true;
    }
  }

  // Returns a port with the given name
  getPort(portname: string, filter?: 'input' | 'output'): NodeGrapPort | undefined {
    const ports = this.getPorts(filter);
    for (const i in ports) {
      if (ports[i].name === portname) {
        return ports[i];
      }
    }
    return undefined;
  }

  // Return all ports, filter is optional and can be 'input' or 'output'
  getPorts(filters?: 'input' | 'output'): NodeGrapPort[] {
    var ports;

    if (!this._ports) {
      // Start with type ports
      var ports = this.type.ports ? this.type.ports : [];

      // Add instance ports from type
      // var instanceports = NodeLibrary.instance.getDynamicPortsForNode(this);
      // if(instanceports) ports = ports.concat(instanceports);
      // Any user defined ports
      if (this.ports) ports = ports.concat(this.ports);

      // Dynamic instance ports on this instance
      if (this.dynamicports) ports = ports.concat(this.dynamicports);

      // Sort on index (assign index in order if not present)
      each(ports, function (p, index) {
        if (p.index === undefined) p.index = index;
      });
      ports.sort(function (a, b) {
        return a.index > b.index ? 1 : -1;
      });

      this._ports = ports;
    } else ports = this._ports;

    return filters
      ? filter(ports, function (p) {
          return p.plug && p.plug.indexOf(filters) !== -1;
        })
      : ports;
  }

  // Add a child as the last child node of this node
  addChild(child: NodeGraphNode, args?) {
    const _this = this;

    this.children.push(child);
    child.parent = this;

    // Set the owner of all children
    child.forEach(function (m) {
      _this.owner && _this.owner.bindTypeModel(m.type);
      m.owner = _this.owner;
    });

    if (this.owner) {
      this.owner.nodeMap.set(child.id, child);
      this.owner.notifyListeners('nodeAdded', { model: child, parent: this, disableSelect: args?.disableSelect });
    }

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      const graph = this.owner;
      undo.push({
        label: args.label,
        do: function () {
          _this.addChild(child);
        },
        undo: function () {
          graph.removeNode(child);
        }
      });
    }
  }

  // Insert a child at a specific index
  insertChild(child: NodeGraphNode, index: number, args?) {
    const _this = this;

    this.children.splice(index, 0, child);
    child.parent = this;

    //iterate through children and register them to the owner (which is a NodeGraphModel)
    child.forEach((m) => {
      this.owner?.bindTypeModel(m.type);
      this.owner?.nodeMap.set(m.id, m);
      m.owner = this.owner;
    });

    if (this.owner) {
      this.owner.nodeMap.set(child.id, child);
      this.owner.notifyListeners('nodeAdded', { model: child, parent: this, index: index });
    }

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      const graph = this.owner;
      undo.push({
        label: args.label,
        do: function () {
          _this.insertChild(child, index);
        },
        undo: function () {
          graph.removeNode(child);
        }
      });
    }
  }

  canAcceptChildren(models: NodeGraphNode[]) {
    if (!this.type.allowChildrenWithCategory) return false;
    for (const i in models) {
      const m = models[i];

      if (
        (!m.type.allowAsChild && !m.type.category) ||
        this.type.allowChildrenWithCategory.indexOf(m.type.category) === -1
      )
        return false;
    }
    return true;
  }

  canBeDeleted() {
    return !this.type.singleton; // Singleton nodes cannot be deleted
  }

  canBeCopied() {
    return !this.type.singleton; // Singleton nodes cannot be copied
  }

  // Set the label for the node, supports undo
  setLabel(label: string, args?: { undo?: any; label?: any }) {
    const _this = this;
    const oldLabel = this.label;

    this.label = label;

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: args.label,
        do: function () {
          _this.setLabel(label);
          _this.notifyListeners('modelParameterRedo');
        },
        undo: function () {
          _this.setLabel(oldLabel);
          _this.notifyListeners('modelParameterUndo');
        }
      });
    }
  }

  // Set a parameter for the node instance
  setParameter(name: string, value, args?) {
    const _this = this;

    if (args && args.undo && typeof args.undo !== 'object')
      // Create undo group if none is provided already
      var undoGroup = (args.undo = new UndoActionGroup({ label: args.label || 'set parameter' }));

    // Changing parameters may lead to new instance ports
    const oldPorts = this.getPorts();
    this._ports = undefined;

    const oldLabel = this.label;
    let oldValue: TSFixme = undefined;

    if (args && args.state !== undefined && args.state !== 'neutral') {
      // Set the parameter for a specific interaction state
      if (this.stateParameters === undefined) this.stateParameters = {};
      if (this.stateParameters[args.state] === undefined) this.stateParameters[args.state] = {};

      oldValue = this.stateParameters[args.state][name];
      if (value === undefined) {
        delete this.stateParameters[args.state][name];
      } else {
        this.stateParameters[args.state][name] = value;
      }
      this.notifyListeners('parametersChanged', {
        name: name,
        oldValue: oldValue,
        value: value,
        state: args.state,
        undo: args ? args.undo : undefined
      });
    } else {
      oldValue = this.parameters[name];
      if (value === undefined) {
        delete this.parameters[name];
      } else {
        this.parameters[name] = value;
      }
      this.notifyListeners('parametersChanged', {
        name: name,
        oldValue: oldValue,
        value: value,
        undo: args ? args.undo : undefined
      });
    }

    // If the ports have changed
    if (!isEqual(oldPorts, this.getPorts())) {
      this.notifyListeners('instancePortsChanged');
    }

    // Also the label may change
    if (this.label !== oldLabel) {
      this.notifyListeners('labelChanged');
    }

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      if (args.oldValue) {
        oldValue = args.oldValue;
      }

      undo.push({
        label: args.label,
        do: function () {
          _this.setParameter(name, value);
          _this.notifyListeners('modelParameterRedo');
        },
        undo: function () {
          _this.setParameter(name, oldValue);
          _this.notifyListeners('modelParameterUndo');
        }
      });

      undoGroup && UndoQueue.instance.push(undoGroup); // Push undo group if it was created
    }
  }

  // Returns the parameter for the given port name
  getParameter(name: string, args?) {
    let value;
    if (args && args.state !== undefined && args.state !== 'neutral') {
      // Look for the parameter value in the state parameters
      if (this.stateParameters && this.stateParameters[args.state] !== undefined)
        value = this.stateParameters[args.state][name];

      // No value in state parameters? try neutral state
      if (value === undefined) value = this.parameters[name];
    } else {
      // Look for the value in the neutral state / base parameters
      value = this.parameters[name];
    }
    if (value !== undefined) return value;

    // No value was found, let's get the correct default value
    if (this.variant) {
      // This model has a varient, default should come from it
      value = this.variant.getParameter(name, args);
    }
    if (value !== undefined) return value;

    // Get the default value from the port
    const port = this.getPort(name, 'input');
    if (!port) return value;

    if (port.type.parentPort) {
      const parentPort = this.getPort(port.type.parentPort, 'input');
      if (parentPort && parentPort.type.name === 'textStyle') {
        const styles = NodeLibrary.instance.getStyles('text');
        const textStyle = this.getParameter(port.type.parentPort, args);
        if (styles[textStyle]) {
          const style = styles[textStyle];
          const childPortPrefix = parentPort.type.childPortPrefix || '';
          const stylePropertyName = name.substring(childPortPrefix.length);
          if (style.hasOwnProperty(stylePropertyName)) {
            return style[stylePropertyName];
          }
        }
      }
    }

    return port ? port.default : undefined;
  }

  // Sets the dynamic instance ports for this node
  setDynamicPorts(ports: NodeGrapPort[], options?: DynamicPortsOptions) {
    if (portsEqual(ports, this.dynamicports)) {
      return;
    }

    this._ports = undefined;
    this.dynamicports = ports;

    if (options && options.renamed) {
      // Some of the ports are renamed from before
      const renamed = options.renamed.length ? options.renamed : [options.renamed];
      each(renamed, (r: DynamicPortsOptions['renamed'][0]) => {
        if (!r.plug || r.plug === 'input') {
          // Move parameter values (inputs only)
          each(r.patterns, (p) => {
            const after = p.replace('{{*}}', r.after);
            const before = p.replace('{{*}}', r.before);
            this.parameters[after] = this.parameters[before];
            delete this.parameters[before];
          });
        }

        // Move connections to renamed ports
        each(r.patterns, (p) => {
          const portname = p.replace('{{*}}', r.before);
          const newname = p.replace('{{*}}', r.after);

          const graph = this.owner;
          for (const i in graph.connections) {
            const c = graph.connections[i];

            if (c.fromProperty === portname && c.fromId === this.id) {
              const oldProperty = c.fromProperty;
              c.fromProperty = newname;
              graph.notifyListeners('connectionPortChanged', { model: c, oldFromProperty: oldProperty });
            } else if (c.toProperty === portname && c.toId === this.id) {
              const oldProperty = c.toProperty;
              c.toProperty = newname;
              graph.notifyListeners('connectionPortChanged', { model: c, oldToProperty: oldProperty });
            }
          }
        });
      });
    }

    this.notifyListeners('instancePortsChanged');
  }

  // Apply a patch to this node
  /*NodeGraphModelNode.prototype.applyPatch = function (p) {
    if (p.typename) this.typename = p.typename;
    if (p.version) this.version = p.version;
    for (var name in p.params) {
      var value = p.params[name];
      if (value === null) this.setParameter(name, undefined);
      else this.setParameter(name, value);
    }
    if(p.portsToDelete) {
      for(const name of p.portsToDelete) {
        this.removePortWithName(name, {force: true});
      }
    }
    this._type = undefined;
    this.updateType();
    this.evaluateHealth();
  };*/

  getHealth() {
    const warnings = WarningsModel.instance.getWarnings({ component: this.owner.owner, node: this });
    if (warnings) {
      return { healthy: false, message: warnings.shortMessage };
    }

    return { healthy: true };
  }

  evaluateHealth() {
    const _this = this;
    if (!this.owner) return; // Not in graph
    if (!this.owner.owner) return; // Not in a component

    // Missing type
    const missingType = NodeLibrary.instance.typeIsMissing(this.type);
    WarningsModel.instance.setWarning(
      { component: this.owner.owner, node: this, key: 'node-missing-type' },
      missingType
        ? {
            message: 'The node type of this instance <strong>' + this.typename + '</strong> is missing.',
            showGlobally: true,
            level: 'error'
          }
        : undefined
    );

    // Cannot be a child
    var w = this.parent && !this.type.allowAsChild;
    WarningsModel.instance.setWarning(
      { component: this.owner.owner, node: this, key: 'node-not-child' },
      !missingType && w //don't show this warning if type is missing since it's a bit superfluous
        ? {
            message: 'This node cannot be a child in a hierarchy',
            showGlobally: true,
            level: 'error'
          }
        : undefined
    );

    // Parent cannot have children
    var w =
      this.type &&
      this.parent &&
      this.parent.type &&
      (!this.parent.type.allowChildrenWithCategory ||
        !this.type.category ||
        this.parent.type.allowChildrenWithCategory.indexOf(this.type.category) === -1);

    WarningsModel.instance.setWarning(
      { component: this.owner.owner, node: this, key: 'node-invalid-child' },
      w
        ? {
            message: 'This node is a child of a node that doesnt support this type of child nodes.',
            level: 'error'
          }
        : undefined
    );

    // Cannot have children
    w = !this.type.allowChildrenWithCategory && this.children && this.children.length > 0;
    WarningsModel.instance.setWarning(
      { component: this.owner.owner, node: this, key: 'node-no-children' },
      !missingType && w //don't show this warning if type is missing since it's a bit superfluous
        ? {
            message: 'This node cannot have children.',
            showGlobally: true,
            level: 'error'
          }
        : undefined
    );

    // Singleton
    w = this.type.allowSingleInstanceOnly && this.owner.hasNodesWithType(this.type);
    WarningsModel.instance.setWarning(
      { component: this.owner.owner, node: this, key: 'node-singleton' },
      w
        ? {
            message:
              'There can only be one instance of this type in a component. Multiple instances may lead to unexpected behavior.',
            level: 'error',
            showGlobally: true
          }
        : undefined
    );

    // Roots must have same category
    var w =
      !this.parent &&
      this.type.allowAsChild &&
      !!find(this.owner.roots, function (n) {
        return n !== _this && n.type.allowAsChild && n.type.category !== _this.type.category;
      });
    WarningsModel.instance.setWarning(
      { component: this.owner.owner, node: this, key: 'node-child-cat' },
      w
        ? {
            message: 'All roots of a component that may be children must have the same category.',
            level: 'error'
          }
        : undefined
    );

    // Merge conflicts
    if (this.conflicts) {
      function clearConflict(c) {
        const idx = _this.conflicts.indexOf(c);
        idx !== -1 && _this.conflicts.splice(idx, 1);
        let key;
        if (c.type === 'parameter' || c.type === 'sourceCode') key = 'node-param-conflict-' + c.name;
        else if (c.type === 'stateParameter') key = 'node-state-param-conflict-' + c.state + '-' + c.name;
        else if (c.type === 'stateTransition') key = 'node-state-trans-conflict-' + c.state + '-' + c.name;
        else if (c.type === 'variant') key = 'node-variant-conflict';
        else if (c.type === 'defaultStateTransition') key = 'node-dfs-conflict-' + c.state;
        else if (c.type === 'typename') key = 'node-type-conflict';

        WarningsModel.instance.setWarning({ component: _this.owner.owner, node: _this, key }, undefined);
      }

      each(this.conflicts, function (c) {
        if (c.type === 'parameter') {
          var port = _this.getPort(c.name);
          var ourValue = NodeLibrary.instance.formatParameterValue(c.oursDisplayName || c.ours, port);
          var theirValue = NodeLibrary.instance.formatParameterValue(c.theirsDisplayName || c.theirs, port);
          var portName = port !== undefined && port.displayName ? port.displayName : c.name;

          WarningsModel.instance.setWarning(
            { component: _this.owner.owner, node: _this, key: 'node-param-conflict-' + c.name },
            {
              type: 'conflict',
              conflictMetadata: {
                parameter: portName,
                ours: ourValue,
                theirs: theirValue
              },
              message: `Merge conflict at parameter ${portName}`,
              showGlobally: true,
              onDismiss: function () {
                clearConflict(c);
              },
              onUseTheirs: function () {
                clearConflict(c);
                _this.setParameter(c.name, c.theirs);
              }
            }
          );
        } else if (c.type === 'sourceCode') {
          var port = _this.getPort(c.name);
          var ourValue = NodeLibrary.instance.formatParameterValue(c.oursDisplayName || c.ours, port);
          var theirValue = NodeLibrary.instance.formatParameterValue(c.theirsDisplayName || c.theirs, port);
          var portName = port !== undefined && port.displayName ? port.displayName : c.name;

          WarningsModel.instance.setWarning(
            { component: _this.owner.owner, node: _this, key: 'node-param-conflict-' + c.name },
            {
              type: 'conflict-source-code',
              conflictMetadata: {
                parameter: portName,
                ours: ourValue,
                theirs: theirValue
              },
              message: `Merge conflict at parameter ${portName}. Edit the code to see a diff, then mark as resolved. Or use theirs to discard your changes.`,
              showGlobally: true,
              onDismiss: function () {
                clearConflict(c);
              },
              onUseTheirs: function () {
                clearConflict(c);
                _this.setParameter(c.name, c.theirs);
              }
            }
          );
        } else if (c.type === 'stateParameter') {
          var state =
            _this.type.visualStates !== undefined ? _this.type.visualStates.find((s) => s.name === c.state) : undefined;
          var stateName = state !== undefined ? state.label : c.state;

          var port = _this.getPort(c.name);
          var ourValue = NodeLibrary.instance.formatParameterValue(c.oursDisplayName || c.ours, port);
          var theirValue = NodeLibrary.instance.formatParameterValue(c.theirsDisplayName || c.theirs, port);
          var portName = port !== undefined && port.displayName ? port.displayName : c.name;

          WarningsModel.instance.setWarning(
            { component: _this.owner.owner, node: _this, key: 'node-state-param-conflict-' + c.state + '-' + c.name },
            {
              type: 'conflict',
              conflictMetadata: {
                parameter: portName,
                ours: ourValue,
                theirs: theirValue
              },
              message: `Merge conflict in visual state parameter ${portName} for state ${stateName}`,
              showGlobally: true,
              onDismiss: function () {
                clearConflict(c);
              },
              onUseTheirs: function () {
                clearConflict(c);
                _this.setParameter(c.name, c.theirs, { state: c.state });
              }
            }
          );
        } else if (c.type === 'stateTransition') {
          var state =
            _this.type.visualStates !== undefined ? _this.type.visualStates.find((s) => s.name === c.state) : undefined;
          var stateName = state !== undefined ? state.label : c.state;

          var port = _this.getPort(c.name);
          var portName = port !== undefined && port.displayName ? port.displayName : c.name;

          WarningsModel.instance.setWarning(
            { component: _this.owner.owner, node: _this, key: 'node-state-trans-conflict-' + c.state + '-' + c.name },
            {
              type: 'conflict',
              conflictMetadata: {
                parameter: portName,
                ours: ourValue,
                theirs: theirValue
              },
              message: `Merge conflict in visual state transition ${portName} for state ${stateName}`,
              showGlobally: true,
              onDismiss: function () {
                clearConflict(c);
              },
              onUseTheirs: function () {
                clearConflict(c);
                _this.setStateTransition(c.state, c.name, c.theirs);
              }
            }
          );
        } else if (c.type === 'variant') {
          WarningsModel.instance.setWarning(
            { component: _this.owner.owner, node: _this, key: 'node-variant-conflict' },
            {
              type: 'conflict',
              level: 'error',
              showGlobally: true,
              message:
                'There is a variant conflict, your variant is <strong>' +
                c.ours +
                '</strong> and their is <strong>' +
                c.theirs +
                '</strong>.',
              onDismiss: function () {
                clearConflict(c);
              },
              onUseTheirs: function () {
                clearConflict(c);
                _this.variant = c.theirs;
              }
            }
          );
        } else if (c.type === 'defaultStateTransition') {
          var state =
            _this.type.visualStates !== undefined ? _this.type.visualStates.find((s) => s.name === c.state) : undefined;
          var stateName = state !== undefined ? state.label : c.state;

          WarningsModel.instance.setWarning(
            { component: _this.owner.owner, node: _this, key: 'node-dfs-conflict-' + c.state },
            {
              type: 'conflict',
              level: 'error',
              showGlobally: true,
              message:
                'There is a conflict in the default state transition for state <strong>' + stateName + '</strong',
              onDismiss: function () {
                clearConflict(c);
              },
              onUseTheirs: function () {
                clearConflict(c);
                _this.setDefaultStateTransition(c.state, c.theirs);
              }
            }
          );
        } else if (c.type === 'typename') {
          WarningsModel.instance.setWarning(
            { component: _this.owner.owner, node: _this, key: 'node-type-conflict' },
            {
              type: 'conflict',
              level: 'error',
              showGlobally: true,
              message:
                'There is a type conflict your type is <strong>' +
                c.ours +
                '</strong> and their is <strong>' +
                c.theirs +
                '</strong>.',
              onDismiss: function () {
                clearConflict(c);
              },
              onUseTheirs: function () {
                clearConflict(c);
                _this.typename = c.theirs;
                _this._type = undefined;
                _this.updateType();
                _this.evaluateHealth();
              }
            }
          );
        }
      });
    }
  }

  updateVariantRef() {
    this._variant = NodeLibrary.instance.findVariant(this.variantName, this.type);
    this.variantName = this._variant !== undefined ? this._variant.name : undefined;
  }

  setVariant(variant, args?) {
    const _oldVariant = this.variant;
    this.variant = variant;

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: 'Change variant',
        do: () => {
          this.setVariant(variant);
        },
        undo: () => {
          this.setVariant(_oldVariant);
        }
      });
    }
  }

  // Replaces entire parameters structures and notifies listeners
  _setParameters(parameters) {
    // Changing parameters may lead to new instance ports
    const oldPorts = this.getPorts();
    this._ports = undefined;

    const oldLabel = this.label;

    const _oldParameters = this.parameters;
    const _oldStateParameters = this.stateParameters;
    this.parameters = parameters.parameters;
    this.stateParameters = parameters.stateParameters;
    this.notifyListeners('parametersChanged', {
      oldParameters: _oldParameters,
      oldStateParameters: _oldStateParameters,
      parameters: this.parameters,
      stateParameters: this.stateParameters
    });

    // If the ports have changed
    if (!isEqual(oldPorts, this.getPorts())) {
      this.notifyListeners('instancePortsChanged');
    }

    // Also the label may change
    if (this.label !== oldLabel) {
      this.notifyListeners('labelChanged');
    }
  }

  createNewVariant(variantName, args) {
    try {
      var project = this.owner.owner.owner;
    } catch (e) {}

    if (project === undefined) return; // This node is not currently in a project

    // Create the variation
    const variant = project.createNewVariant(variantName, this);
    if (variant === undefined) return; // Did not success creating variant

    // Reset all parameters on this node
    const _oldParameters = this.parameters;
    const _oldStateParameters = this.stateParameters;
    const _oldStateTransitions = this.stateTransitions;
    const _oldDefaultStateTransitions = this.defaultStateTransitions;

    const _oldVariant = this.variant;
    this.variant = variant;

    this._setParameters({ parameters: {}, stateParameters: {} });
    this._setStateTransitions({ stateTransitions: {}, defaultStateTransitions: {} });

    this.notifyListeners('variantCreated', { variant: this.variant });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      const type = this.type;

      undo.push({
        label: 'Create new variant',
        do: () => {
          this.createNewVariant(variantName, this);
        },
        undo: () => {
          project.deleteVariant(variantName, type);

          this._setParameters({ parameters: _oldParameters, stateParameters: _oldStateParameters });
          this._setStateTransitions({
            stateTransitions: _oldStateTransitions,
            defaultStateTransitions: _oldDefaultStateTransitions
          });

          this.variant = _oldVariant;
        }
      });
    }
  }

  updateVariant(args) {
    try {
      var project = this.owner.owner.owner;
    } catch (e) {}

    if (project === undefined) return; // This node is not currently in a project

    if (this.variant === undefined) return; // have no variant

    // Push parameters to variant
    const _oldVariantParameters = JSON.parse(JSON.stringify(this.variant.parameters));
    const _oldVariantStateParameters = this.variant.stateParameters
      ? JSON.parse(JSON.stringify(this.variant.stateParameters))
      : undefined;
    const _oldVariantStateTransitions = this.variant.stateTransitions
      ? JSON.parse(JSON.stringify(this.variant.stateTransitions))
      : undefined;
    const _oldVariantDefaultStateTransitions = this.variant.defaultStateTransitions
      ? JSON.parse(JSON.stringify(this.variant.defaultStateTransitions))
      : undefined;
    this.variant.updateFromNode(this);

    // Reset parameters
    const _oldParameters = this.parameters;
    const _oldStateParameters = this.stateParameters;
    const _oldStateTransitions = this.stateTransitions;
    const _oldDefaultStateTransitions = this.defaultStateTransitions;

    this._setParameters({ parameters: {}, stateParameters: {} });
    this._setStateTransitions({ stateTransitions: {}, defaultStateTransitions: {} });

    this.notifyListeners('variantUpdated', { variant: this.variant });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: 'Update variant',
        do: () => {
          this.updateVariant(args);
        },
        undo: () => {
          // Revert to old variant parameters
          this.variant.setParameters({
            parameters: _oldVariantParameters,
            stateParameters: _oldVariantStateParameters,
            stateTransitions: _oldVariantStateTransitions,
            defaultStateTransitions: _oldVariantDefaultStateTransitions
          });

          // Revert to old node parameters
          this._setParameters({ parameters: _oldParameters, stateParameters: _oldStateParameters });
          this._setStateTransitions({
            stateTransitions: _oldStateTransitions,
            defaultStateTransitions: _oldDefaultStateTransitions
          });

          this.notifyListeners('variantUpdated', { variant: this.variant });
        }
      });
    }
  }

  getStateTransition(state, parameterName) {
    state = state || 'neutral';

    if (
      this.stateTransitions !== undefined &&
      this.stateTransitions[state] !== undefined &&
      this.stateTransitions[state][parameterName] !== undefined
    ) {
      return this.stateTransitions[state][parameterName];
    }

    if (
      this.variant &&
      this.variant.stateTransitions !== undefined &&
      this.variant.stateTransitions[state] !== undefined
    )
      return this.variant.stateTransitions[state][parameterName];
  }

  _setStateTransitions(transitions) {
    const _oldStateTransitions = this.stateTransitions;
    const _oldDefaultStateTransitions = this.defaultStateTransitions;
    this.stateTransitions = transitions.stateTransitions;
    this.defaultStateTransitions = transitions.defaultStateTransitions;
    this.notifyListeners('stateTransitionsChanged', {
      oldStateTransitions: _oldStateTransitions,
      oldDefaultStateTransitions: _oldDefaultStateTransitions,
      stateTransitions: this.stateTransitions,
      defaultStateTransitions: this.defaultStateTransitions
    });
  }

  setStateTransition(state, parameterName, curve, args?) {
    state = state || 'neutral';

    if (this.stateTransitions === undefined) this.stateTransitions = {};
    if (this.stateTransitions[state] === undefined) this.stateTransitions[state] = {};

    const _oldStateTransition = this.stateTransitions[state][parameterName];
    this.stateTransitions[state][parameterName] = curve;

    this.notifyListeners('stateTransitionsChanged', { state: state, parameterName: parameterName, curve: curve });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: 'set state transition',
        do: () => {
          this.setStateTransition(state, parameterName, curve, args);
        },
        undo: () => {
          this.stateTransitions[state][parameterName] = _oldStateTransition;

          this.notifyListeners('stateTransitionsChanged', {
            state: state,
            parameterName: parameterName,
            curve: _oldStateTransition
          });
        }
      });
    }
  }

  getDefaultStateTransition(state = 'neutral') {
    if (this.defaultStateTransitions !== undefined && this.defaultStateTransitions[state] !== undefined)
      return this.defaultStateTransitions[state];

    if (this.variant !== undefined) return this.variant.getDefaultStateTransition(state);
  }

  setDefaultStateTransition(state = 'neutral', curve, args?) {
    if (this.defaultStateTransitions === undefined) this.defaultStateTransitions = {};

    const _oldDefaultStateTransition = this.defaultStateTransitions[state];
    this.defaultStateTransitions[state] = curve;

    this.notifyListeners('defaultStateTransitionChanged', { state, curve });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: 'set default state transition',
        do: () => {
          this.setDefaultStateTransition(state, curve, args);
        },
        undo: () => {
          this.defaultStateTransitions[state] = _oldDefaultStateTransition;

          this.notifyListeners('defaultStateTransitionChanged', { state, curve: _oldDefaultStateTransition });
        }
      });
    }
  }

  getPossibleTransitionsForState(state) {
    const _this = this;
    const transitions = {};

    function _addTransitions(stateParameters) {
      for (const parameterName in stateParameters) {
        const port = _this.getPort(parameterName);
        if (NodeLibrary.instance.canPortHaveTransition(port))
          transitions[parameterName] = {
            name: parameterName,
            displayName: port ? port.displayName : undefined,
            group: port ? port.group : undefined
          };
      }
    }

    if (state !== undefined && state !== 'neutral') {
      // Find all properties that have a value set for this state
      if (this.stateParameters && this.stateParameters[state]) _addTransitions(this.stateParameters[state]);

      // Also check the variant for state parameters
      if (this.variant !== undefined && this.variant.stateParameters && this.variant.stateParameters[state])
        _addTransitions(this.variant.stateParameters[state]);

      return Object.keys(transitions).map((t) => transitions[t]);
    } else {
      // This is the neutral state, it should contain all properties for all states
      this.type.visualStates &&
        this.type.visualStates.forEach((state) => {
          // Add state parameters from this node
          if (this.stateParameters && this.stateParameters[state.name])
            _addTransitions(this.stateParameters[state.name]);

          // and also add any from the variant
          if (this.variant !== undefined && this.variant.stateParameters && this.variant.stateParameters[state.name])
            _addTransitions(this.variant.stateParameters[state.name]);
        });

      return Object.keys(transitions).map((t) => transitions[t]);
    }
  }

  toJSON() {
    const json = {
      id: this.id,
      type: this.typename,
      variant: this.variant ? this.variant.name : undefined,
      version: this.version,
      label: this._label,
      x: this.x,
      y: this.y,
      parameters: JSON.parse(JSON.stringify(this.parameters)),
      stateParameters: this.stateParameters ? JSON.parse(JSON.stringify(this.stateParameters)) : undefined,
      stateTransitions: this.stateTransitions ? JSON.parse(JSON.stringify(this.stateTransitions)) : undefined,
      defaultStateTransitions: this.defaultStateTransitions
        ? JSON.parse(JSON.stringify(this.defaultStateTransitions))
        : undefined,
      ports: this.ports ? JSON.parse(JSON.stringify(this.ports)) : undefined,
      dynamicports: this.dynamicports ? JSON.parse(JSON.stringify(this.dynamicports)) : undefined,
      conflicts: this.conflicts ? JSON.parse(JSON.stringify(this.conflicts)) : undefined,
      children: [],
      metadata: this.metadata
    };

    for (const parameterName in json.parameters) {
      try {
        if (isSourceCodePort(json.type, parameterName)) {
          json.metadata = json.metadata || {};
          json.metadata.merge = json.metadata.merge || { soureCodePorts: [] };

          json.metadata.merge.soureCodePorts.push(parameterName);

          //fixes a bug where the soureCodePortss contained duplicated entries
          json.metadata.merge.soureCodePorts = [...new Set(json.metadata.merge.soureCodePorts)];
        }
      } catch (e) {
        console.log('error saving node metadata', e);
      }
    }

    for (const i in this.children) {
      json.children.push(this.children[i].toJSON());
    }
    return json;
  }
}

function portsEqual(a: NodeGrapPort[], b: NodeGrapPort[]) {
  function objectEquals(x, y) {
    if (x === null || x === undefined || y === null || y === undefined) {
      return x === y;
    }

    if (x === y) {
      return true;
    }
    if (Array.isArray(x) && x.length !== y.length) {
      return false;
    }

    // if they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) return false;
    if (!(y instanceof Object)) return false;

    //recursive object equality check
    //but skip the 'index' parameter, the viewer will never send that for dynamic ports
    const p = Object.keys(x);
    return (
      Object.keys(y).every((i) => {
        if (i === 'index') return true;
        return p.indexOf(i) !== -1;
      }) && p.every((i) => objectEquals(x[i], y[i]))
    );
  }

  const bPorts = {};
  for (const port of b) {
    bPorts[port.name] = port;
  }

  if (a.length !== b.length) return false;

  return a.every((port) => {
    return objectEquals(port, bPorts[port.name]);
  });
}

const _sourceCodePortCache = new Map();

function _isSourceCodePort(typename, parameterName) {
  const type = NodeLibrary.instance.getNodeTypeWithName(typename); // all should have same type, type cannot be changed
  if (!type) return false;

  let port;

  if (type.ports) {
    port = type.ports.find((p) => p.name === parameterName);
  }
  if (!port && type.dynamicports) {
    for (let j = 0; j < type.dynamicports.length && !port; j++) {
      if (type.dynamicports[j].ports) {
        port = type.dynamicports[j].ports.find((p) => p.name === parameterName);
      }
    }
  }

  let language = port?.type?.codeeditor;

  if (!language) return false;

  language = language.toLowerCase();

  if (language === 'javascript' || language === 'json' || language === 'css') {
    return true;
  }

  return false;
}

function isSourceCodePort(typename, parameterName) {
  const hash = typename + '-' + parameterName;
  if (!_sourceCodePortCache.has(hash)) {
    _sourceCodePortCache.set(hash, _isSourceCodePort(typename, parameterName));
  }

  return _sourceCodePortCache.get(hash);
}
