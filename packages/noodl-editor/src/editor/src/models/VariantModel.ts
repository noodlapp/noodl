import _ from 'underscore';

import { UndoQueue } from '@noodl-models/undo-queue-model';

import Model from '../../../shared/model';
import { NodeLibrary } from './nodelibrary';
import { WarningsModel } from './warningsmodel';

function _merge(dst, src) {
  for (const key in src) {
    if (src[key] !== undefined) {
      dst[key] = JSON.parse(JSON.stringify(src[key]));
    }
  }
}

export class VariantModel extends Model {
  name: string;
  typename: any;
  parameters: {};
  stateParameters: {};
  stateTransitions: {};
  defaultStateTransitions: any;
  _ports: any;
  _type: any;
  conflicts: any;

  constructor(args) {
    super();

    this.name = args.name;
    this.typename = args.typename;
    this.parameters = {};
    this.stateParameters = {};
    this.stateTransitions = {};
  }

  // This will copy the parameter values from the node and merge with
  // existing values (keeping old values in the variant)
  updateFromNode(node) {
    _merge(this.parameters, node.parameters);

    // Merge state parameters
    if (node.stateParameters) {
      if (this.stateParameters === undefined) this.stateParameters = {};
      for (var state in node.stateParameters) {
        if (this.stateParameters[state] === undefined) this.stateParameters[state] = {};
        _merge(this.stateParameters[state], node.stateParameters[state]);
      }
    }

    // Merge state transitions
    if (node.stateTransitions) {
      if (this.stateTransitions === undefined) this.stateTransitions = {};
      for (var state in node.stateTransitions) {
        if (this.stateTransitions[state] === undefined) this.stateTransitions[state] = {};
        _merge(this.stateTransitions[state], node.stateTransitions[state]);
      }
    }

    // Merge state transitions
    if (node.defaultStateTransitions) {
      if (this.defaultStateTransitions === undefined) this.defaultStateTransitions = {};
      _merge(this.defaultStateTransitions, node.defaultStateTransitions);
    }

    this.notifyListeners('variantParametersChanged');
  }

  // This will update the parameters but from an other variant
  updateFromVariant(variant) {
    _merge(this.parameters, variant.parameters);

    // Merge state parameters
    if (variant.stateParameters) {
      if (this.stateParameters === undefined) this.stateParameters = {};
      for (var state in variant.stateParameters) {
        if (this.stateParameters[state] === undefined) this.stateParameters[state] = {};
        _merge(this.stateParameters[state], variant.stateParameters[state]);
      }
    }

    // Merge state transitions
    if (variant.stateTransitions) {
      if (this.stateTransitions === undefined) this.stateTransitions = {};
      for (var state in variant.stateTransitions) {
        if (this.stateTransitions[state] === undefined) this.stateTransitions[state] = {};
        _merge(this.stateTransitions[state], variant.stateTransitions[state]);
      }
    }

    // Merge state transitions
    if (variant.defaultStateTransitions) {
      if (this.defaultStateTransitions === undefined) this.defaultStateTransitions = {};
      _merge(this.defaultStateTransitions, variant.defaultStateTransitions);
    }

    this.notifyListeners('variantParametersChanged');
  }

  setParameters(args) {
    this.parameters = args.parameters;
    this.stateParameters = args.stateParamaters;
    this.stateTransitions = args.stateTransitions;
    this.defaultStateTransitions = args.defaultStateTransitions;

    this.notifyListeners('variantParametersChanged');
  }

  hasParameter(name, args) {
    if (args && args.state !== undefined && args.state !== 'neutral') {
      if (this.stateParameters !== undefined && this.stateParameters[args.state] !== undefined)
        return this.stateParameters[args.state][name] !== undefined;
    } else return this.parameters[name] !== undefined;

    return false;
  }

  getPort(portname, filter?) {
    const ports = this.getPorts(filter);
    for (const i in ports) if (ports[i].name === portname) return ports[i];
  }

  getPorts(filter?) {
    var ports;

    if (!this._ports) {
      // Start with type ports
      const type = this.getType();
      if (type === undefined) return [];

      var ports = type.ports ? type.ports : [];

      // Sort on index (assign index in order if not present)
      ports.sort(function (a, b) {
        return a.index > b.index ? 1 : -1;
      });

      this._ports = ports;
    } else ports = this._ports;

    return filter
      ? _.filter(ports, function (p) {
          return p.plug && p.plug.indexOf(filter) !== -1;
        })
      : ports;
  }

  getType() {
    if (this._type) return this._type;

    this._type = NodeLibrary.instance.getNodeTypeWithName(this.typename);
    return this._type;
  }

  getParameter(name, args) {
    let value;
    if (args && args.state !== undefined && args.state !== 'neutral') {
      // Look for the parameter value in the state parameters
      if (this.stateParameters !== undefined && this.stateParameters[args.state] !== undefined)
        value = this.stateParameters[args.state][name];

      // No value in state parameters, try neutral state
      if (value === undefined) value = this.parameters[name];
    } else {
      // Look for the value in the neutral state / base parameters
      value = this.parameters[name];
    }
    if (value !== undefined) return value;

    // Get the default value from the port default
    const port = this.getPort(name, 'input');
    return port ? port.default : undefined;
  }

  setParameter(name, value, args?) {
    if (args && args.state !== undefined && args.state !== 'neutral') {
      // Set the parameter for a specific interaction state
      if (this.stateParameters === undefined) this.stateParameters = {};
      if (this.stateParameters[args.state] === undefined) this.stateParameters[args.state] = {};

      var oldValue = this.stateParameters[args.state][name];
      if (value === undefined) {
        delete this.stateParameters[args.state][name];
      } else {
        this.stateParameters[args.state][name] = value;
      }
      this.notifyListeners('variantParametersChanged', { name: name, value: value, state: args.state });
    } else {
      var oldValue = this.parameters[name];
      if (value === undefined) {
        delete this.parameters[name];
      } else {
        this.parameters[name] = value;
      }
      this.notifyListeners('variantParametersChanged', { name: name, value: value });
    }

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      if (args.oldValue) {
        oldValue = args.oldValue;
      }

      undo.push({
        label: args.label,
        do: () => {
          this.setParameter(name, value);
        },
        undo: () => {
          this.setParameter(name, oldValue);
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

    if (this.stateParameters === undefined) return [];

    if (state !== undefined && state !== 'neutral') {
      // Find all properties that have a value set for this state
      if (this.stateParameters && this.stateParameters[state]) _addTransitions(this.stateParameters[state]);

      return Object.keys(transitions).map((t) => transitions[t]);
    } else {
      // This is the neutral state, it should contain all properties for all states
      const type = this.getType();
      if (type === undefined) return [];
      type.visualStates &&
        type.visualStates.forEach((state) => {
          // Add state parameters from this node
          if (this.stateParameters && this.stateParameters[state.name])
            _addTransitions(this.stateParameters[state.name]);
        });

      return Object.keys(transitions).map((t) => transitions[t]);
    }
  }

  getStateTransition(state = 'neutral', parameterName) {
    if (this.stateTransitions !== undefined && this.stateTransitions[state] !== undefined)
      return this.stateTransitions[state][parameterName];
  }

  setStateTransition(state = 'neutral', parameterName, curve, args?) {
    if (this.stateTransitions === undefined) this.stateTransitions = {};
    if (this.stateTransitions[state] === undefined) this.stateTransitions[state] = {};

    const _oldStateTransition = this.stateTransitions[state][parameterName];
    this.stateTransitions[state][parameterName] = curve;

    this.notifyListeners('variantStateTransitionsChanged', {
      state: state,
      parameterName: parameterName,
      curve: curve
    });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: 'set variant state transition',
        do: () => {
          this.setStateTransition(state, parameterName, curve, args);
        },
        undo: () => {
          this.stateTransitions[state][parameterName] = _oldStateTransition;

          this.notifyListeners('variantStateTransitionsChanged', {
            state: state,
            parameterName: parameterName,
            curve: _oldStateTransition
          });
        }
      });
    }
  }

  getDefaultStateTransition(state = 'neutral') {
    if (this.defaultStateTransitions !== undefined) return this.defaultStateTransitions[state];
  }

  setDefaultStateTransition(state = 'neutral', curve, args?) {
    if (this.defaultStateTransitions === undefined) this.defaultStateTransitions = {};

    const _oldDefaultStateTransition = this.defaultStateTransitions[state];
    this.defaultStateTransitions[state] = curve;

    this.notifyListeners('variantDefaultStateTransitionChanged', { state, curve });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: 'set variant default state transition',
        do: () => {
          this.setDefaultStateTransition(state, curve, args);
        },
        undo: () => {
          this.defaultStateTransitions[state] = _oldDefaultStateTransition;

          this.notifyListeners('variantDefaultStateTransitionChanged', { state, curve: _oldDefaultStateTransition });
        }
      });
    }
  }

  evaluateHealth() {
    const clearConflict = (c) => {
      const idx = this.conflicts.indexOf(c);
      idx !== -1 && this.conflicts.splice(idx, 1);
      let key;
      if (c.type === 'parameter')
        key = 'variant-param-conflict-' + this.name + '-' + this.getType().fullName + '-' + c.name;
      else if (c.type === 'stateParameter')
        key =
          'variant-state-param-conflict-' + this.name + '-' + this.getType().fullName + '-' + c.state + '-' + c.name;
      else if (c.type === 'stateTransition')
        key =
          'variant-state-trans-conflict-' + this.name + '-' + this.getType().fullName + '-' + c.state + '-' + c.name;
      else if (c.type === 'defaultStateTransition')
        key = 'variant-dst-conflict-' + this.name + '-' + this.getType().fullName + '-' + c.state;

      WarningsModel.instance.setWarning({ key }, undefined);
    };

    if (this.conflicts)
      this.conflicts.forEach((c) => {
        if (c.type === 'parameter') {
          var port = this.getPort(c.name);
          var ourValue = NodeLibrary.instance.formatParameterValue(c.oursDisplayName || c.ours, port);
          var theirValue = NodeLibrary.instance.formatParameterValue(c.theirsDisplayName || c.theirs, port);
          var portName = port !== undefined && port.displayName ? port.displayName : c.name;

          WarningsModel.instance.setWarning(
            { key: 'variant-param-conflict-' + this.name + '-' + this.getType().fullName + '-' + c.name },
            {
              type: 'conflict',
              conflictMetadata: {
                parameter: portName,
                ours: ourValue,
                theirs: theirValue
              },
              message: `Merge conflict in variant ${this.name} for type ${this.getType().displayName}`,
              showGlobally: true,
              onDismiss: () => {
                clearConflict(c);
              },
              onUseTheirs: () => {
                clearConflict(c);
                this.setParameter(c.name, c.theirs);
              }
            }
          );
        } else if (c.type === 'stateParameter') {
          var state =
            this.getType().visualStates !== undefined
              ? this.getType().visualStates.find((s) => s.name === c.state)
              : undefined;
          var stateName = state !== undefined ? state.label : c.state;

          var port = this.getPort(c.name);
          var ourValue = NodeLibrary.instance.formatParameterValue(c.oursDisplayName || c.ours, port);
          var theirValue = NodeLibrary.instance.formatParameterValue(c.theirsDisplayName || c.theirs, port);
          var portName = port !== undefined && port.displayName ? port.displayName : c.name;

          WarningsModel.instance.setWarning(
            {
              key:
                'variant-state-param-conflict-' +
                this.name +
                '-' +
                this.getType().fullName +
                '-' +
                c.state +
                '-' +
                c.name
            },
            {
              type: 'conflict',
              conflictMetadata: {
                parameter: portName,
                ours: ourValue,
                theirs: theirValue
              },
              message: `Merge conflict in variant ${this.name} for type ${
                this.getType().displayName
              } in visual state parameter for state ${stateName}`,
              showGlobally: true,
              onDismiss: () => {
                clearConflict(c);
              },
              onUseTheirs: () => {
                clearConflict(c);
                this.setParameter(c.name, c.theirs, { state: c.state });
              }
            }
          );
        } else if (c.type === 'stateTransition') {
          var state =
            this.getType().visualStates !== undefined
              ? this.getType().visualStates.find((s) => s.name === c.state)
              : undefined;
          var stateName = state !== undefined ? state.label : c.state;

          var port = this.getPort(c.name);
          var portName = port !== undefined && port.displayName ? port.displayName : c.name;

          WarningsModel.instance.setWarning(
            {
              key:
                'variant-state-trans-conflict-' +
                this.name +
                '-' +
                this.getType().fullName +
                '-' +
                c.state +
                '-' +
                c.name
            },
            {
              type: 'conflict',
              conflictMetadata: {
                parameter: portName,
                ours: ourValue,
                theirs: theirValue
              },
              message: `Merge conflict in variant ${this.name} for type ${
                this.getType().displayName
              } in visual state transition ${portName} for state ${stateName}`,
              showGlobally: true,
              onDismiss: () => {
                clearConflict(c);
              },
              onUseTheirs: () => {
                clearConflict(c);
                this.setStateTransition(c.state, c.name, c.theirs);
              }
            }
          );
        } else if (c.type === 'defaultStateTransition') {
          const state =
            this.getType().visualStates !== undefined
              ? this.getType().visualStates.find((s) => s.name === c.state)
              : undefined;
          const stateName = state !== undefined ? state.label : c.state;

          WarningsModel.instance.setWarning(
            { key: 'variant-dst-conflict-' + this.name + '-' + this.getType().fullName + '-' + c.state },
            {
              type: 'conflict',
              conflictMetadata: {
                parameter: portName,
                ours: ourValue,
                theirs: theirValue
              },
              message: `Merge conflict in variant ${this.name} for type ${
                this.getType().displayName
              } in default visual state transition ${portName} for state ${stateName}`,
              level: 'error',
              showGlobally: true,
              onDismiss: () => {
                clearConflict(c);
              },
              onUseTheirs: () => {
                clearConflict(c);
                this.setDefaultStateTransition(c.state, c.theirs);
              }
            }
          );
        }
      });
  }

  toJSON() {
    const json = {
      name: this.name,
      typename: this.typename,
      parameters: this.parameters,
      stateParamaters: this.stateParameters,
      stateTransitions: this.stateTransitions,
      defaultStateTransitions: this.defaultStateTransitions,
      conflicts: this.conflicts ? JSON.parse(JSON.stringify(this.conflicts)) : undefined
    };

    return json;
  }

  static fromJSON(json) {
    const _this = new VariantModel({
      name: json.name,
      typename: json.typename
    });

    _this.parameters = json.parameters;
    _this.stateParameters = json.stateParamaters;
    _this.stateTransitions = json.stateTransitions;
    _this.defaultStateTransitions = json.defaultStateTransitions;
    _this.conflicts = json.conflicts;

    return _this;
  }
}
