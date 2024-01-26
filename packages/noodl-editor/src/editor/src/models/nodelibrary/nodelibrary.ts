import _ from 'underscore';

import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { BasicNodeType } from '@noodl-models/nodelibrary/BasicNodeType';
import { UnknownNodeType } from '@noodl-models/nodelibrary/UnknownNodeType';

import Model from '../../../../shared/model';
import { ModelProxy } from '../../views/panels/propertyeditor/models/modelProxy';

const _condFuncCache = {};
function evaluateDynamicPortsCondition(cond, node) {
  if (cond.startsWith('#js')) {
    // This is a JS expression
    if (_condFuncCache[cond] === undefined)
      _condFuncCache[cond] = new Function('params', 'return ' + cond.substring('#js'.length));

    return !!_condFuncCache[cond](
      new Proxy(node.parameters, {
        get: (target, prop, receiver) => {
          return node.getParameter(prop);
        }
      })
    );
  }

  const tokens = cond.match(/(?:[^\s']+|'[^']*')+/g); // Split on whitespace but respect single qoutes

  function evalCond(i) {
    if (tokens.length < i + 3) return true;

    const paramName = tokens[i + 0].replace(/'/g, ''); // Trim any quotes
    const op = tokens[i + 1];
    const value = tokens[i + 2].replace(/'/g, '');

    let res;
    switch (op) {
      case '=':
        res = '' + node.getParameter(paramName) === value;
        break;
      case '!=':
        res = '' + node.getParameter(paramName) !== value;
        break;
      case 'NOT':
        res = node.getParameter(paramName) === undefined;
        break;
    }

    if (tokens.length > i + 3) {
      const logic = tokens[i + 3];
      switch (logic) {
        case 'AND':
          return res && evalCond(i + 4);
        case 'OR':
          return res || evalCond(i + 4);
      }
    }

    return res;
  }

  return evalCond(0);
}

// TODO: Very ugly how we handle nodes in here now
export type NodeLibraryNodeType = (BasicNodeType | UnknownNodeType) & {
  ports: TSFixme[];
  dynamicports: TSFixme[];
  runtimeTypes?: string[];
};

export class NodeLibrary extends Model {
  public static instance = new NodeLibrary();

  modules: TSFixme[];
  typeCache: Map<TSFixme, TSFixme>;
  types: ComponentModel[];
  unkownNodeTypes: TSFixme;
  library: TSFixme;

  constructor() {
    super();

    this.modules = [];

    //have all types available in a name => type map to improve performance
    //of getNodeTypeWithName which is a major hotspot
    this.typeCache = new Map();
    this.loadLibrary();

    return this;
  }

  /** Returns the name for a port type */
  static nameForPortType(type: string | { name: string }) {
    if (!type) return;
    return typeof type === 'string' ? type : type.name;
  }

  loadLibrary() {
    this.types = [];
    this.typeCache.clear();
    this.unkownNodeTypes = {};

    // @ts-expect-error window be scary!
    this.library = (typeof window !== 'undefined' ? window.NodeLibraryData : {}) || {};

    // Register basic types from the node library
    for (const i in this.library.nodetypes) {
      const type = this.library.nodetypes[i];

      this.registerType(new BasicNodeType(type));
    }

    // Dynamic port managers
    // this.dynamicPortManagers = [];
    /*  var dynamicPortManagerTypes = {
      'numbered':NodeLibrary.DynamicPortNumbered,
      'portchannel':NodeLibrary.DynamicPortChannel,
      'conditionalports':NodeLibrary.DynamicPortConditional,
      'expand':NodeLibrary.DynamicPortExpand,
    };*/
    /*  for(var i in this.library.dynamicports) {
      var type = this.library.dynamicports[i].type;
  
      if(type && dynamicPortManagerTypes[type])
        this.dynamicPortManagers.push(new dynamicPortManagerTypes[type](this.library.dynamicports[i]));
    }*/
    // Make sure the default color scheme is present
    if (!this.library.colors) this.library.colors = { nodes: {}, connections: {} };
    if (!this.library.colors.nodes.default) {
      this.library.colors.nodes.default = {
        base: '#485e65',
        text: '#93a1a1'
      };
    }
    if (!this.library.colors.connections.default) {
      this.library.colors.connections.default = {
        normal: '#916311',
        highlighted: '#ffa300'
      };
    }
  }

  reload() {
    this.loadLibrary();
    this.notifyListeners('libraryUpdated');
  }

  isLoaded() {
    return this.types.length > 0;
  }

  registerModule(module) {
    this.modules.push(module);
    module._registered = true;

    //keep this.typeCache in sync by removing components that are removed from registered modules
    //no need to listen for new components since getNodeTypeWithName handles types that arent in the typeCache
    module.on(
      'componentRemoved',
      ({ model }) => {
        this.typeCache.delete(model.name);
      },
      this
    );

    this.notifyListeners('moduleRegistered', { model: module });
  }

  unregisterModule(module) {
    module.off(this);

    const idx = this.modules.indexOf(module);
    idx !== -1 && this.modules.splice(idx, 1);
    module._registered = false;
    this.typeCache.clear();
    this.notifyListeners('moduleUnregistered', { model: module });
  }

  isModuleRegistered(module) {
    return module._registered;
  }

  _getNodeTypeWithName(typename) {
    const types = this.types.concat(this.getComponents());

    return _.find(types, function (type) {
      return type.name === typename;
    });
  }

  getNodeTypeWithName(typename: string): NodeLibraryNodeType {
    const hasLoadedNodeLib = this.types.length;
    if (hasLoadedNodeLib && !this.typeCache.has(typename)) {
      const types = this.types.concat(this.getComponents());
      types.forEach((type) => this.typeCache.set(type.name, type));
    }

    return this.typeCache.get(typename);
  }

  getNodeTypes() {
    return this.types;
  }

  getComponents(): ComponentModel[] {
    let components = [];

    for (const i in this.modules) {
      const m = this.modules[i];

      components = components.concat(m.getComponents());
    }

    return components;
  }

  registerType(type) {
    this.types.push(type);
  }

  getUnknownNodeType(typename: string): UnknownNodeType {
    if (!this.unkownNodeTypes[typename]) this.unkownNodeTypes[typename] = new UnknownNodeType(typename);

    return this.unkownNodeTypes[typename];
  }

  typeIsMissing(type) {
    if (
      !type ||
      type instanceof UnknownNodeType || // Type has not been resolved
      (type.graph && !type.owner)
    ) {
      // Type is component but not part of a project
      return true;
    }

    return false;
  }

  colorSchemeForNodeColorName(name) {
    return this.library.colors.nodes[name] || this.library.colors.nodes.default;
  }

  colorSchemeForNodeType(type) {
    if (!type.color) return this.library.colors.nodes.default;
    return this.library.colors.nodes[type.color];
  }

  colorSchemeForConnectionType(type) {
    if (!this.library.colors.connections[type]) return this.library.colors.connections.default;
    return this.library.colors.connections[type];
  }

  // This function returns the annotated name for a port this is generally the
  // display name for the port plus any annotations such as the unit for numbers
  getAnnotatedPortName(node, port) {
    const displayName =
      (port.displayName ? port.displayName : port.name) +
      (port.tab && port.tab.label ? ' (' + port.tab.label + ')' : '');

    // Annotate an number port with units with the current unit
    if (NodeLibrary.nameForPortType(port.type) === 'number' && port.type.units !== undefined) {
      const haveUnit = node.parameters[port.name] !== undefined && node.parameters[port.name].unit !== undefined;
      return (
        displayName +
        '<span class="portname-annotation-unit">&nbsp;(' +
        (haveUnit ? node.parameters[port.name].unit : port.type.defaultUnit) +
        ')<span>'
      );
    }

    return displayName;
  }

  formatParameterValue(value, port) {
    if (!port) return value;
    if (value === undefined) return;

    // If it's an enum node, it must return the label
    if (NodeLibrary.nameForPortType(port.type) === 'enum') {
      if (value === undefined) return 'none';

      const e = _.find(port.type.enums, function (e) {
        return e === value || e.value === value;
      });
      if (e === undefined) return;

      return e.label ? e.label : e;
    }

    // If the value has a unit, format it
    else if (NodeLibrary.nameForPortType(port.type) === 'number' && port.type.units !== undefined) {
      if (value.unit !== undefined) return value.value + '' + value.unit;
      else return value + '' + port.type.units[0];
    }

    return value;
  }

  typeRenamed(model, oldName) {
    this.typeCache.delete(oldName);
    this.typeCache.set(model.name, model);
    this.notifyListeners('typeRenamed', { model, oldName });
  }

  findVariant(variantName, nodeType) {
    let variant = null;

    for (const m of this.modules) {
      if (m.findVariant) variant = m.findVariant(variantName, nodeType);
      if (variant !== undefined) return variant;
    }

    return variant;
  }

  getStyles(styleType) {
    for (const m of this.modules) {
      if (m.getMetaData) {
        const styles = m.getMetaData('styles');
        if (styles && styles[styleType]) {
          return styles[styleType];
        }
      }
    }

    return {};
  }

  // Return true if a type can be casted to
  canCastPortTypes(from, to) {
    const _from = NodeLibrary.nameForPortType(from);
    const _to = NodeLibrary.nameForPortType(to);

    if (_from === '*' || _to === '*') return true; // All types
    if (_from === _to) return true; // Same type

    // Not same type, look in cast list
    const cast = _.find(this.library.typecasts, function (c) {
      return c.from === _from;
    });
    if (!cast) return false;

    return cast.to.indexOf(_to) !== -1;
  }

  // This function attempts to find a type that is compatible with all connections
  // in the supplied array. The connections array should be on the form
  // [{direction:'to',type: 'number'},
  //  {direction:'from',type: 'boolean'}, ...]
  // The direction is the direction which the compatible type should be able to cast to
  // the supplied type. In the example above the function will attempt to find a type
  // that can cast to a number, and that can be casted to from a boolean.
  findCompatiblePortType(connections) {
    const _this = this;

    // Returns true if all types are castable in the
    // correct direction
    function isCompatible(type) {
      for (const i in connections) {
        const c = connections[i];

        const from = c.direction === 'from' ? c.type : type;
        const to = c.direction === 'to' ? c.type : type;
        if (!_this.canCastPortTypes(from, to)) return false;
      }
      return true;
    }

    // Merges modifiers for all types
    function mergeModifiers(types) {
      const merged = {} as any;

      // Merge enums
      let enums = [];
      _.each(types, function (t) {
        if (t.enums) enums = _.union(enums, t.enums);
      });
      merged.enums = enums.length > 0 ? enums : undefined;

      // Merge other modifiers
      _.each(types, function (t) {
        merged.multiline = merged.multiline || t.multiline;
        merged.allowConnectionsOnly = merged.allowConnectionsOnly || t.allowConnectionsOnly;
        merged.allowEditOnly = merged.allowEditOnly || t.allowEditOnly;
      });

      for (const i in merged) if (merged[i] === undefined) delete merged[i]; // Delete undefined
      return merged;
    }

    if (
      _.every(connections, function (c) {
        return NodeLibrary.nameForPortType(c.type) === NodeLibrary.nameForPortType(connections[0].type);
      })
    ) {
      // All ports have the same type, return a merged type
      return _.extend(
        { name: NodeLibrary.nameForPortType(connections[0].type) },
        mergeModifiers(_.pluck(connections, 'type'))
      );
    } else {
      const explicitTypeConnections = connections.filter(function (c) {
        return NodeLibrary.nameForPortType(c.type) !== '*';
      });
      if (explicitTypeConnections.length === 1) return explicitTypeConnections[0].type;

      // Iterate over all possible typecasts until a match that
      // supports all connections are found
      for (const i in this.library.typecasts) {
        const type = this.library.typecasts[i].from;

        if (isCompatible(type)) return _.extend({ name: type }, mergeModifiers(_.pluck(connections, 'type')));
      }
    }
  }

  // Project settings template from node library
  getProjectSettingsPorts() {
    return this.library.projectsettings || {};
  }

  applyPortConditionsFilterForNode(node: NodeGraphNode | ModelProxy, modes?: TSFixme): string[] {
    if (!node.type.dynamicports) return [];

    // Allow dynamic ports to be used in multiple conditions
    const ports = {};

    for (const i in node.type.dynamicports) {
      const ref = node.type.dynamicports[i];
      if (
        ref.name.startsWith('conditionalports/') &&
        (modes === undefined || modes.indexOf(ref.name.split('/')[1]) !== -1)
      ) {
        if (!evaluateDynamicPortsCondition(ref.condition, node)) {
          // Condition failed, these ports should be removed
          ref.ports.forEach((p) => {
            if (ports[p.name] === undefined) {
              ports[p.name] = true;
            }
          });
        } else {
          ref.ports.forEach((p) => {
            ports[p.name] = false;
          });
        }
      }
    }

    return Object.keys(ports).filter((key) => ports[key]);
  }

  isConditionalPortValid(node, portname, modes) {
    if (!node.type.dynamicports) return true;

    for (const i in node.type.dynamicports) {
      const ref = node.type.dynamicports[i];
      if (
        ref.name.startsWith('conditionalports/') &&
        (modes === undefined || modes.indexOf(ref.name.split('/')[1]) !== -1)
      ) {
        if (ref.ports.find((p) => p.name === portname) !== undefined) {
          return evaluateDynamicPortsCondition(ref.condition, node);
        }
      }
    }

    return true;
  }

  canPortHaveTransition(port) {
    function _typename() {
      return typeof port.type === 'object' ? port.type.name : port.type;
    }

    if (port === undefined) return false;

    return _typename() === 'color' || _typename() === 'number' || _typename() === 'dimension';
  }
}
