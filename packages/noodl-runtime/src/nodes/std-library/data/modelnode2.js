'use strict';

const { Node } = require('../../../../noodl-runtime');

var Model = require('../../../model');

var ModelNodeDefinition = {
  name: 'Model2',
  docs: 'https://docs.noodl.net/nodes/data/object/object-node',
  displayNodeName: 'Object',
  shortDesc:
    'Stores any amount of properties and can be used standalone or together with Collections and For Each nodes.',
  category: 'Data',
  usePortAsLabel: 'modelId',
  color: 'data',
  dynamicports: [
    {
      name: 'conditionalports/extended',
      condition: 'idSource = explicit OR idSource NOT SET',
      inputs: ['modelId']
    }
  ],
  initialize: function () {
    var internal = this._internal;
    internal.inputValues = {};
    internal.dirtyValues = {};

    var _this = this;
    this._internal.onModelChangedCallback = function (args) {
      if (_this.isInputConnected('fetch') === true) return;

      if (_this.hasOutput('prop-' + args.name)) _this.flagOutputDirty('prop-' + args.name);

      if (_this.hasOutput('changed-' + args.name)) _this.sendSignalOnOutput('changed-' + args.name);

      _this.sendSignalOnOutput('changed');
    };
  },
  getInspectInfo() {
    const model = this._internal.model;
    if (!model) return '[No Object]';

    return [
      { type: 'text', value: 'Id: ' + model.getId() },
      { type: 'value', value: model.data }
    ];
  },
  outputs: {
    id: {
      type: 'string',
      displayName: 'Id',
      group: 'General',
      getter: function () {
        return this._internal.model ? this._internal.model.getId() : this._internal.modelId;
      }
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
    }
  },
  inputs: {
    idSource: {
      type: {
        name: 'enum',
        enums: [
          { label: 'Specify explicitly', value: 'explicit' },
          { label: 'From repeater', value: 'foreach' }
        ],
        allowEditOnly: true
      },
      default: 'explicit',
      displayName: 'Get Id from',
      group: 'General',
      set: function (value) {
        if (value === 'foreach') {
          this.scheduleAfterInputsHaveUpdated(() => {
            // Find closest nodescope that have a _forEachModel
            var component = this.nodeScope.componentOwner;
            while (component !== undefined && component._forEachModel === undefined && component.parentNodeScope) {
              component = component.parentNodeScope.componentOwner;
            }
            this.setModel(component !== undefined ? component._forEachModel : undefined);
          });
        }
      }
    },
    modelId: {
      type: {
        name: 'string',
        identifierOf: 'ModelName',
        identifierDisplayName: 'Object Ids'
      },
      displayName: 'Id',
      group: 'General',
      set: function (value) {
        if (value instanceof Model) value = value.getId();
        // Can be passed as model as well
        else if (typeof value === 'object') value = Model.create(value).getId(); // If this is an js object, dereference it

        this._internal.modelId = value; // Wait to fetch data
        if (this.isInputConnected('fetch') === false) this.setModelID(value);
        else {
          this.flagOutputDirty('id');
        }
      }
    },
    properties: {
      type: { name: 'stringlist', allowEditOnly: true },
      displayName: 'Properties',
      group: 'Properties',
      set: function (value) {}
    },
    fetch: {
      displayName: 'Fetch',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleSetModel();
      }
    }
  },
  prototypeExtensions: {
    scheduleStore: function () {
      if (this.hasScheduledStore) return;
      this.hasScheduledStore = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(() => {
        this.hasScheduledStore = false;
        if (!internal.model) return;

        for (var i in internal.dirtyValues) {
          internal.model.set(i, internal.inputValues[i], { resolve: true });
        }
        internal.dirtyValues = {}; // Reset dirty values
      });
    },
    scheduleSetModel: function () {
      if (this.hasScheduledSetModel) return;
      this.hasScheduledSetModel = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(() => {
        this.hasScheduledSetModel = false;
        this.setModelID(this._internal.modelId);
      });
    },
    setModelID: function (id) {
      var model = (this.nodeScope.modelScope || Model).get(id);
      this.setModel(model);
      this.sendSignalOnOutput('fetched');
    },
    setModel: function (model) {
      if (this._internal.model)
        // Remove old listener if existing
        this._internal.model.off('change', this._internal.onModelChangedCallback);

      this._internal.model = model;
      this.flagOutputDirty('id');

      // In set idSource, we are calling setModel with undefined
      if (model) {
        model.on('change', this._internal.onModelChangedCallback);

        // We have a new model, mark all outputs as dirty
        for (var key in model.data) {
          if (this.hasOutput('prop-' + key)) this.flagOutputDirty('prop-' + key);
        }
      }
    },
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
      if (this._internal.model) this._internal.model.off('change', this._internal.onModelChangedCallback);
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name.startsWith('prop-'))
        this.registerOutput(name, {
          getter: userOutputGetter.bind(this, name.substring('prop-'.length))
        });
    },
    registerInputIfNeeded: function (name) {
      var _this = this;

      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('prop-'))
        this.registerInput(name, {
          set: userInputSetter.bind(this, name.substring('prop-'.length))
        });
    }
  }
};

function userOutputGetter(name) {
  /* jshint validthis:true */
  return this._internal.model ? this._internal.model.get(name, { resolve: true }) : undefined;
}

function userInputSetter(name, value) {
  /* jshint validthis:true */
  this._internal.inputValues[name] = value;

  // Store on change if no connection to store or new
  const model = this._internal.model;
  const valueChanged = model ? model.get(name) !== value : true;
  if (valueChanged) {
    this._internal.dirtyValues[name] = true;
    this.scheduleStore();
  }
}

function updatePorts(nodeId, parameters, editorConnection) {
  var ports = [];

  // Add value outputs
  var properties = parameters.properties;
  if (properties) {
    properties = properties ? properties.split(',') : undefined;
    for (var i in properties) {
      var p = properties[i];

      ports.push({
        type: {
          name: '*',
          allowConnectionsOnly: true
        },
        plug: 'input/output',
        group: 'Properties',
        name: 'prop-' + p,
        displayName: p
      });

      ports.push({
        type: 'signal',
        plug: 'output',
        group: 'Changed Events',
        displayName: p + ' Changed',
        name: 'changed-' + p
      });
    }
  }

  editorConnection.sendDynamicPorts(nodeId, ports, {
    detectRenamed: {
      plug: 'input/output'
    }
  });
}

module.exports = {
  node: ModelNodeDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    graphModel.on('nodeAdded.Model2', function (node) {
      updatePorts(node.id, node.parameters, context.editorConnection);

      node.on('parameterUpdated', function (event) {
        updatePorts(node.id, node.parameters, context.editorConnection);
      });
    });
  }
};
