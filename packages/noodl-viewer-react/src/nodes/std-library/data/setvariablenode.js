'use strict';

const { Node } = require('@noodl/runtime');

const Model = require('@noodl/runtime/src/model');
const Collection = require('@noodl/runtime/src/collection');

var SetVariableNodeDefinition = {
  name: 'Set Variable',
  docs: 'https://docs.noodl.net/nodes/data/variable/set-variable',
  category: 'Data',
  usePortAsLabel: 'name',
  color: 'data',
  initialize: function () {
    var internal = this._internal;

    internal.variablesModel = Model.get('--ndl--global-variables');
  },
  outputs: {
    done: {
      type: 'signal',
      displayName: 'Done',
      group: 'Events'
    }
  },
  inputs: {
    name: {
      type: {
        name: 'string',
        identifierOf: 'VariableName',
        identifierDisplayName: 'Variable names'
      },
      displayName: 'Name',
      group: 'General',
      set: function (value) {
        this._internal.name = value;
      }
    },
    setWith: {
      type: {
        name: 'enum',
        enums: [
          { label: 'String', value: 'string' },
          { label: 'Boolean', value: 'boolean' },
          { label: 'Number', value: 'number' },
          { label: 'Empty string', value: 'emptyString' },
          { label: 'Date', value: 'date' },
          { label: 'Object', value: 'object' },
          { label: 'Array', value: 'array' },
          { label: 'Any', value: '*' }
        ],
        allowEditOnly: true
      },
      displayName: 'Set as',
      default: '*',
      group: 'General',
      set: function (value) {
        this._internal.setWith = value;
      }
    },
    do: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleStore();
      }
    }
  },
  methods: {
    setValue: function (value) {
      this._internal.value = value;
    },
    scheduleStore: function () {
      if (this.hasScheduledStore) return;
      this.hasScheduledStore = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(function () {
        this.hasScheduledStore = false;

        var value = internal.setWith === 'emptyString' ? '' : internal.value;

        if (internal.setWith === 'object' && typeof value === 'string') value = Model.get(value); // Can set arrays with "id" or array
        if (internal.setWith === 'array' && typeof value === 'string') value = Collection.get(value); // Can set arrays with "id" or array
        if (internal.setWith === 'boolean') value = !!value;

        //use forceChange to always trigger Variable nodes to send the value on their output, even if it's the same value twice
        internal.variablesModel.set(internal.name, value, {
          forceChange: true
        });
        this.sendSignalOnOutput('done');
      });
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name === 'value')
        this.registerInput(name, {
          set: this.setValue.bind(this)
        });
    }
  }
};

module.exports = {
  node: SetVariableNodeDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    graphModel.on('nodeAdded.Set Variable', function (node) {
      function _updatePorts() {
        var ports = [];

        if (node.parameters.setWith === 'emptyString') {
          // No ports needed
        } else {
          ports.push({
            type: node.parameters.setWith !== undefined ? node.parameters.setWith : '*',
            plug: 'input',
            group: 'General',
            name: 'value',
            displayName: 'Value'
          });
        }

        context.editorConnection.sendDynamicPorts(node.id, ports);
      }

      _updatePorts();

      node.on('parameterUpdated', function (event) {
        _updatePorts();
      });
    });
  }
};
