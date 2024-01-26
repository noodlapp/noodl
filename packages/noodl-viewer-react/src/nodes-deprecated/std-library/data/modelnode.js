'use strict';

const { Node } = require('@noodl/runtime');

var Model = require('@noodl/runtime/src/model');

//var previousProperties = {};

var ModelNodeDefinition = {
  name: 'Model',
  docs: 'https://docs.noodl.net/nodes/data/object',
  displayNodeName: 'Object',
  shortDesc:
    'Stores any amount of properties and can be used standalone or together with Collections and For Each nodes.',
  category: 'Data',
  usePortAsLabel: 'modelId',
  color: 'data',
  deprecated: true, // Use new model node
  initialize: function () {
    var internal = this._internal;
    internal.inputValues = {};

    var _this = this;
    this._internal.onModelChangedCallback = function (args) {
      if (_this.isInputConnected('fetch') === true) return;

      if (_this.hasOutput(args.name)) _this.flagOutputDirty(args.name);

      if (_this.hasOutput('changed-' + args.name)) _this.sendSignalOnOutput('changed-' + args.name);

      _this.sendSignalOnOutput('changed');
    };
  },
  getInspectInfo() {
    const model = this._internal.model;
    if (!model) return '[No Object]';

    const modelInfo = [{ type: 'text', value: 'Id: ' + model.getId() }];

    const data = this._internal.model.data;
    return modelInfo.concat(
      Object.keys(data).map((key) => {
        return { type: 'text', value: key + ': ' + data[key] };
      })
    );
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
    /*  currentModel: {
      type: 'object',
      displayName: 'Object',
      group: 'General',
      getter: function () {
          return this._internal.model;
      }
    },*/
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
    created: {
      type: 'signal',
      displayName: 'Created',
      group: 'Events'
    }
  },
  inputs: {
    modelId: {
      type: {
        name: 'string',
        identifierOf: 'ModelName',
        identifierDisplayName: 'Object Ids'
      },
      displayName: 'Id',
      group: 'General',
      set: function (value) {
        if (value instanceof Model) value = value.getId(); // Can be passed as model as well
        this._internal.modelId = value; // Wait to fetch data
        if (this.isInputConnected('fetch') === false) this.setModelID(value);
        else {
          this.flagOutputDirty('id');
        }
      }
    },
    /*  model:{
      type:'object',
      displayName:'Object',
      group: 'General',
      set: function (value) {
        if(value === undefined) return;
        if(value === this._internal.model) return;

        if(!(value instanceof Model) && typeof value === 'object') {
          // This is a regular JS object, convert to model
          value = Model.create(value);
        }

        this._internal.modelId = value.getId(); 
        if(this.isInputConnected('fetch') === false)
          this.setModelID(this._internal.modelId);
        else {
          this.flagOutputDirty('id');
        }
      }
    },*/
    properties: {
      type: { name: 'stringlist', allowEditOnly: true },
      displayName: 'Properties',
      group: 'Properties',
      set: function (value) {}
    },
    new: {
      displayName: 'New',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleNew();
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
        this.scheduleSetModel();
      }
    },
    clear: {
      displayName: 'Clear',
      group: 'Actions',
      valueChangedToTrue: function () {
        var internal = this._internal;
        if (!internal.model) return;
        for (var i in internal.inputValues) {
          internal.model.set(i, undefined, { resolve: true });
        }
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

        for (var i in internal.inputValues) {
          internal.model.set(i, internal.inputValues[i], { resolve: true });
        }
        this.sendSignalOnOutput('stored');
      });
    },
    scheduleNew: function () {
      if (this.hasScheduledNew) return;
      this.hasScheduledNew = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(() => {
        this.hasScheduledNew = false;
        const newModel = Model.get();

        for (var i in internal.inputValues) {
          newModel.set(i, internal.inputValues[i], { resolve: true });
        }

        this.setModel(newModel);

        this.sendSignalOnOutput('created');
        this.sendSignalOnOutput('stored');
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
      var model = Model.get(id);
      this.setModel(model);
      this.sendSignalOnOutput('fetched');
    },
    setModel: function (model) {
      if (this._internal.model)
        // Remove old listener if existing
        this._internal.model.off('change', this._internal.onModelChangedCallback);

      this._internal.model = model;
      this.flagOutputDirty('id');
      model.on('change', this._internal.onModelChangedCallback);

      // We have a new model, mark all outputs as dirty
      for (var key in model.data) {
        if (this.hasOutput(key)) this.flagOutputDirty(key);
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

      this.registerOutput(name, {
        getter: userOutputGetter.bind(this, name)
      });
    },
    registerInputIfNeeded: function (name) {
      var _this = this;

      if (this.hasInput(name)) {
        return;
      }

      this.registerInput(name, {
        set: userInputSetter.bind(this, name)
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
  if (this.isInputConnected('store') === false && this.isInputConnected('new') === false) {
    const model = this._internal.model;
    const valueChanged = model ? model.get(name) !== value : true;
    if (valueChanged) {
      this.scheduleStore();
    }
  }
}

/*function detectRename(before, after) {
  if (!before || !after) return;

  if (before.length !== after.length) return; // Must be of same length

  var res = {}
  for (var i = 0; i < before.length; i++) {
    if (after.indexOf(before[i]) === -1) {
      if (res.before) return; // Can only be one from before that is missing
      res.before = before[i];
    }

    if (before.indexOf(after[i]) === -1) {
      if (res.after) return; // Only one can be missing,otherwise we cannot match
      res.after = after[i];
    }
  }

  return (res.before && res.after) ? res : undefined;
}*/

/*const defaultStorageInitCode = "initialize({\n"+
"\t// Here you can initialize new models\n"+
"\tmyProperty:'Some init value',\n"+
"\tanotherProperty:function() { return 'Some other value')\n"+
"})\n";

const defaultStorageValidateCode = "validation({\n"+
"\t// Here you add validation specifications for your model properties.\n"+
"\tmyProperty: { required:true, length:4 },\n"+
"\tanotherProperty: function(value) {\n"+
"\t\tif(value !== 'someValue) return 'Error message'\n"+
"\t}\n"+
"})\n";*/

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
        name: p
      });

      ports.push({
        type: 'signal',
        plug: 'output',
        group: 'Changed Events',
        displayName: p + ' Changed',
        name: 'changed-' + p
      });
    }

    /*  var propertyRenamed = detectRename(previousProperties[nodeId], properties);
    previousProperties[nodeId] = properties;
    if (propertyRenamed) {
      var renamed = {
        plug: 'input/output',
        patterns: ['{{*}}'],
        before: propertyRenamed.before,
        after: propertyRenamed.after
      };
    }*/
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

    graphModel.on('nodeAdded.Model', function (node) {
      updatePorts(node.id, node.parameters, context.editorConnection);

      node.on('parameterUpdated', function (event) {
        updatePorts(node.id, node.parameters, context.editorConnection);
      });
    });
  }
};
