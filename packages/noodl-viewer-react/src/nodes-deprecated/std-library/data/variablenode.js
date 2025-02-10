'use strict';

const { Node } = require('@noodl/runtime');
const Model = require('@noodl/runtime/src/model');

const VariableNodeDefinition = {
  name: 'Variable',
  docs: 'https://docs.noodl.net/nodes/data/variable',
  category: 'Data',
  usePortAsLabel: 'name',
  color: 'data',
  deprecated: true, // use newvariable instead
  initialize: function () {
    var _this = this;
    var internal = this._internal;

    this._internal.onModelChangedCallback = function (args) {
      if (!_this.isInputConnected('fetch') && args.name === internal.name) {
        _this.sendSignalOnOutput('changed');
        _this.flagOutputDirty('value');
      }
    };

    internal.variablesModel = Model.get('--ndl--global-variables');
    internal.variablesModel.on('change', this._internal.onModelChangedCallback);
  },
  getInspectInfo() {
    if (this._internal.name) {
      return this._internal.variablesModel.get(this._internal.name);
    }

    return '[No value set]';
  },
  outputs: {
    name: {
      type: 'string',
      displayName: 'Name',
      group: 'General',
      getter: function () {
        return this._internal.name;
      }
    },
    stored: {
      type: 'signal',
      displayName: 'Stored',
      group: 'Events'
    },
    changed: {
      type: 'signal',
      displayName: 'Changed',
      group: 'Events'
    },
    fetched: {
      type: 'signal',
      displayName: 'Fetched',
      group: 'Events'
    },
    value: {
      type: '*',
      displayName: 'Value',
      group: 'General',
      getter: function () {
        var internal = this._internal;
        if (!internal.name) return;

        return internal.variablesModel.get(internal.name);
      }
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
        if (this.isInputConnected('fetch') === false) this.setVariableName(value);
        else {
          this._internal.name = value; // Wait to fetch data
          this.flagOutputDirty('name');
        }
      }
    },
    store: {
      displayName: 'Set',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleStore();
      }
    },
    fetch: {
      displayName: 'Fetch',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.setVariableName(this._internal.name);
      }
    },
    value: {
      type: '*',
      displayName: 'Value',
      group: 'General',
      set: function (value) {
        this._internal.value = value;
        if (this.isInputConnected('store') === false) {
          this.scheduleStore();
        }
      }
    }
  },
  prototypeExtensions: {
    scheduleStore: function () {
      if (this.hasScheduledStore) return;
      this.hasScheduledStore = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(function () {
        this.hasScheduledStore = false;

        internal.variablesModel.set(internal.name, internal.value);
        this.sendSignalOnOutput('stored');
      });
    },
    setVariableName: function (name) {
      this._internal.name = name;
      this.flagOutputDirty('name');
      this.flagOutputDirty('value');
      this.sendSignalOnOutput('fetched');
    },
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
      this._internal.variablesModel.off('change', this._internal.onModelChangedCallback);
    }
  }
};

module.exports = {
  node: VariableNodeDefinition
};
