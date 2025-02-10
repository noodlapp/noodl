'use strict';

const { Node, EdgeTriggeredInput } = require('../../../../noodl-runtime');

const Model = require('../../../model');
const CloudStore = require('../../../api/cloudstore');

const ModelNodeDefinition = {
  name: 'DbModel2',
  docs: 'https://docs.noodl.net/nodes/data/cloud-data/record',
  displayNodeName: 'Record',
  shortDesc: 'Database model',
  category: 'Cloud Services',
  usePortAsLabel: 'collectionName',
  color: 'data',
  dynamicports: [
    {
      name: 'conditionalports/extended',
      condition: 'idSource = explicit OR idSource NOT SET',
      inputs: ['modelId']
    }
  ],
  initialize: function () {
    const internal = this._internal;
    internal.inputValues = {};
    internal.relationModelIds = {};

    const _this = this;
    this._internal.onModelChangedCallback = function (args) {
      if (_this.isInputConnected('fetch')) return;

      if (_this.hasOutput('prop-' + args.name)) _this.flagOutputDirty('prop-' + args.name);

      if (_this.hasOutput('changed-' + args.name)) _this.sendSignalOnOutput('changed-' + args.name);

      _this.sendSignalOnOutput('changed');
    };
  },
  getInspectInfo() {
    const model = this._internal.model;
    if (!model) return '[No Record]';

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
    fetched: {
      type: 'signal',
      displayName: 'Fetched',
      group: 'Events'
    },
    changed: {
      type: 'signal',
      displayName: 'Changed',
      group: 'Events'
    },
    failure: {
      type: 'signal',
      displayName: 'Failure',
      group: 'Events'
    },
    error: {
      type: 'string',
      displayName: 'Error',
      group: 'Error',
      getter: function () {
        return this._internal.error;
      }
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
      displayName: 'Id Source',
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
      type: { name: 'string', allowConnectionsOnly: true },
      displayName: 'Id',
      group: 'General',
      set: function (value) {
        if (value instanceof Model) {
          // Can be passed as model as well
          value = value.getId();
        } else if (typeof value === 'object') {
          // If this is an js object, dereference it
          value = Model.create(value).getId();
        }

        this._internal.modelId = value; // Wait to fetch data
        if (this.isInputConnected('fetch') === false) {
          this.setModelID(value);
        } else {
          this.flagOutputDirty('id');
        }
      }
    },
    fetch: {
      displayName: 'Fetch',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleFetch();
      }
    }
  },
  methods: {
    setCollectionID: function (id) {
      this._internal.collectionId = id;
    },
    setModelID: function (id) {
      var model = (this.nodeScope.modelScope || Model).get(id);
      // this._internal.modelIsNew = false;
      this.setModel(model);
    },
    setModel: function (model) {
      if (this._internal.model) {
        // Remove old listener if existing
        this._internal.model.off('change', this._internal.onModelChangedCallback);
      }

      this._internal.model = model;
      this.flagOutputDirty('id');
      model.on('change', this._internal.onModelChangedCallback);

      // We have a new model, mark all outputs as dirty
      for (var key in model.data) {
        if (this.hasOutput('prop-' + key)) {
          this.flagOutputDirty('prop-' + key);
        }
      }
      this.sendSignalOnOutput('fetched');
    },
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
      if (this._internal.model) this._internal.model.off('change', this._internal.onModelChangedCallback);
    },
    scheduleOnce: function (type, cb) {
      const _this = this;
      const _type = 'hasScheduled' + type;
      if (this._internal[_type]) return;
      this._internal[_type] = true;
      this.scheduleAfterInputsHaveUpdated(function () {
        _this._internal[_type] = false;
        cb();
      });
    },
    setError: function (err) {
      this._internal.error = err;
      this.flagOutputDirty('error');
      this.sendSignalOnOutput('failure');

      if (this.context.editorConnection) {
        this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'storage-op-warning', {
          message: err,
          showGlobally: true
        });
      }
    },
    clearWarnings() {
      if (this.context.editorConnection) {
        this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'storage-op-warning');
      }
    },
    scheduleFetch: function () {
      const _this = this;
      const internal = this._internal;

      this.scheduleOnce('Fetch', function () {
        // Don't do fetch if no id
        if (internal.modelId === undefined || internal.modelId === '') {
          _this.setError('Missing Id.');
          return;
        }

        const cloudstore = CloudStore.forScope(_this.nodeScope.modelScope);
        cloudstore.fetch({
          collection: internal.collectionId,
          objectId: internal.modelId, // Get the objectId part of the model id
          success: function (response) {
            const model = cloudstore._fromJSON(response, internal.collectionId);
            if (internal.model !== model) {
              // Check if we need to change model
              if (internal.model) {
                // Remove old listener if existing
                internal.model.off('change', internal.onModelChangedCallback);
              }

              internal.model = model;
              model.on('change', internal.onModelChangedCallback);
            }
            _this.flagOutputDirty('id');

            delete response.objectId;

            for (const key in response) {
              if (_this.hasOutput('prop-' + key)) {
                _this.flagOutputDirty('prop-' + key);
              }
            }

            _this.sendSignalOnOutput('fetched');
          },
          error: function (err) {
            _this.setError(err || 'Failed to fetch.');
          }
        });
      });
    },
    scheduleStore: function () {
      var internal = this._internal;
      if (!internal.model) return;

      this.scheduleOnce('Store', function () {
        for (var i in internal.inputValues) {
          internal.model.set(i, internal.inputValues[i], { resolve: true });
        }
      });
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
      if (this.hasInput(name)) {
        return;
      }

      const dynamicSignals = {};

      if (dynamicSignals[name])
        return this.registerInput(name, {
          set: EdgeTriggeredInput.createSetter({
            valueChangedToTrue: dynamicSignals[name]
          })
        });

      const dynamicSetters = {
        collectionName: this.setCollectionID.bind(this)
      };

      if (dynamicSetters[name])
        return this.registerInput(name, {
          set: dynamicSetters[name]
        });

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
  //console.log('dbmodel setter:',name,value)
  /* jshint validthis:true */
  this._internal.inputValues[name] = value;
}

function updatePorts(nodeId, parameters, editorConnection, graphModel) {
  var ports = [];

  const dbCollections = graphModel.getMetaData('dbCollections');
  const systemCollections = graphModel.getMetaData('systemCollections');

  const _systemClasses = [
    { label: 'User', value: '_User' },
    { label: 'Role', value: '_Role' }
  ];
  ports.push({
    name: 'collectionName',
    displayName: 'Class',
    group: 'General',
    type: {
      name: 'enum',
      enums: _systemClasses.concat(
        dbCollections !== undefined
          ? dbCollections.map((c) => {
              return { value: c.name, label: c.name };
            })
          : []
      ),
      allowEditOnly: true
    },
    plug: 'input'
  });

  if (parameters.collectionName && dbCollections) {
    // Fetch ports from collection keys
    var c = dbCollections.find((c) => c.name === parameters.collectionName);
    if (c === undefined && systemCollections) c = systemCollections.find((c) => c.name === parameters.collectionName);
    if (c && c.schema && c.schema.properties) {
      var props = c.schema.properties;
      for (var key in props) {
        var p = props[key];
        if (ports.find((_p) => _p.name === key)) continue;

        if (p.type !== 'Relation') {
          // Other schema type ports
          const _typeMap = {
            String: 'string',
            Boolean: 'boolean',
            Number: 'number',
            Date: 'date'
          };

          ports.push({
            type: {
              name: _typeMap[p.type] ? _typeMap[p.type] : '*'
            },
            plug: 'output',
            group: 'Properties',
            name: 'prop-' + key,
            displayName: key
          });

          ports.push({
            type: 'signal',
            plug: 'output',
            group: 'Changed Events',
            displayName: key + ' Changed',
            name: 'changed-' + key
          });
        }
      }
    }
  }

  editorConnection.sendDynamicPorts(nodeId, ports);
}

module.exports = {
  node: ModelNodeDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      updatePorts(node.id, node.parameters, context.editorConnection, graphModel);

      node.on('parameterUpdated', function () {
        updatePorts(node.id, node.parameters, context.editorConnection, graphModel);
      });

      graphModel.on('metadataChanged.dbCollections', function () {
        CloudStore.invalidateCollections();
        updatePorts(node.id, node.parameters, context.editorConnection, graphModel);
      });

      graphModel.on('metadataChanged.systemCollections', function () {
        CloudStore.invalidateCollections();
        updatePorts(node.id, node.parameters, context.editorConnection, graphModel);
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.DbModel2', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('DbModel2')) {
        _managePortsForNode(node);
      }
    });
  }
};
