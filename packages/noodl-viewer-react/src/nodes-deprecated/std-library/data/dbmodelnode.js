'use strict';

const { Node, EdgeTriggeredInput } = require('@noodl/runtime');
const isEqual = require('lodash.isequal');

var Model = require('@noodl/runtime/src/model');
const CloudStore = require('@noodl/runtime/src/api/cloudstore');

var modelPortsHash = {},
  previousProperties = {};

var ModelNodeDefinition = {
  name: 'DbModel',
  docs: 'https://docs.noodl.net/nodes/cloud-services/model',
  displayNodeName: 'Model',
  shortDesc: 'Database model',
  category: 'Cloud Services',
  usePortAsLabel: '$ndlCollectionName',
  color: 'data',
  deprecated: true, // Use record node
  initialize: function () {
    var internal = this._internal;
    internal.inputValues = {};
    internal.relationModelIds = {};

    var _this = this;
    this._internal.onModelChangedCallback = function (args) {
      if (_this.isInputConnected('fetch')) return;

      if (_this.hasOutput(args.name)) _this.flagOutputDirty(args.name);

      if (_this.hasOutput('changed-' + args.name)) _this.sendSignalOnOutput('changed-' + args.name);

      _this.sendSignalOnOutput('changed');
    };
  },
  getInspectInfo() {
    const model = this._internal.model;
    if (!model) return '[No Model]';

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
    saved: {
      type: 'signal',
      displayName: 'Saved',
      group: 'Events'
    },
    stored: {
      type: 'signal',
      displayName: 'Stored',
      group: 'Events'
    },
    created: {
      type: 'signal',
      displayName: 'Created',
      group: 'Events'
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
    deleted: {
      type: 'signal',
      displayName: 'Deleted',
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
      group: 'Events',
      getter: function () {
        return this._internal.error;
      }
    }
  },
  inputs: {
    modelId: {
      type: { name: 'string', allowConnectionsOnly: true },
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
        this.scheduleFetch();
      }
    },
    store: {
      displayName: 'Set',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleStore();
      }
    },
    save: {
      displayName: 'Save',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.storageSave();
      }
    },
    delete: {
      displayName: 'Delete',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.storageDelete();
      }
    },
    new: {
      displayName: 'New',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.storageNew();
      }
    },
    insert: {
      displayName: 'Insert',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.storageInsert();
        //  this.storageSave();
      }
    }
  },
  methods: {
    setCollectionID: function (id) {
      this._internal.collectionId = id;
      this.clearWarnings();
    },
    setModelID: function (id) {
      var model = Model.get(id);
      // this._internal.modelIsNew = false;
      this.setModel(model);
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
    _hasChangesPending: function () {
      const internal = this._internal;
      var model = internal.model;

      for (var key in internal.inputValues) {
        if (isEqual(model.data[key], internal.inputValues[key])) return true;
      }

      return false;
    },
    scheduleFetch: function () {
      var _this = this;
      const internal = this._internal;

      if (!this.checkWarningsBeforeCloudOp()) return;

      this.scheduleOnce('Fetch', function () {
        if (internal.modelId === undefined || internal.modelId === '') return; // Don't do fetch if no id

        CloudStore.instance.fetch({
          collection: internal.collectionId,
          objectId: internal.modelId, // Get the objectId part of the model id
          success: function (response) {
            var model = CloudStore._fromJSON(response, internal.collectionId);
            if (internal.model !== model) {
              // Check if we need to change model
              if (internal.model)
                // Remove old listener if existing
                internal.model.off('change', internal.onModelChangedCallback);

              internal.model = model;
              model.on('change', internal.onModelChangedCallback);
            }
            _this.flagOutputDirty('id');

            delete response.objectId;

            for (var key in response) {
              // model.set(key,response[key]);

              if (_this.hasOutput(key)) _this.flagOutputDirty(key);
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
      var _this = this;
      var internal = this._internal;
      if (!internal.model) return;

      if (!this.checkWarningsBeforeCloudOp()) return;

      this.scheduleOnce('Store', function () {
        for (var i in internal.inputValues) {
          internal.model.set(i, internal.inputValues[i], { resolve: true });
        }
        _this.sendSignalOnOutput('stored');
      });
    },
    storageSave: function () {
      const _this = this;
      const internal = this._internal;

      if (!this.checkWarningsBeforeCloudOp()) return;

      //console.log('dbmodel save scheduled')
      this.scheduleOnce('StorageSave', function () {
        if (!internal.model) return;
        var model = internal.model;
        //console.log('dbmodel save hasChanges='+_this._hasChangesPending())
        //if(!_this._internal.modelIsNew && !_this._hasChangesPending()) return; // No need to save, no changes pending

        for (var i in internal.inputValues) {
          model.set(i, internal.inputValues[i], { resolve: true });
        }

        CloudStore.instance.save({
          collection: internal.collectionId,
          objectId: model.getId(), // Get the objectId part of the model id
          data: model.data,
          success: function (response) {
            for (var key in response) {
              model.set(key, response[key]);
            }
            //                        _this._internal.modelIsNew = false; // If the model was a new model, it is now saved
            _this.sendSignalOnOutput('saved');
          },
          error: function (err) {
            _this.setError(err || 'Failed to save.');
          }
        });
      });
    },
    storageDelete: function () {
      const _this = this;
      if (!this._internal.model) return;
      const internal = this._internal;

      if (!this.checkWarningsBeforeCloudOp()) return;

      this.scheduleOnce('StorageDelete', function () {
        CloudStore.instance.delete({
          collection: internal.collectionId,
          objectId: internal.model.getId(), // Get the objectId part of the model id,
          success: function () {
            internal.model.notify('delete'); // Notify that this model has been deleted
            _this.sendSignalOnOutput('deleted');
          },
          error: function (err) {
            _this.setError(err || 'Failed to delete.');
          }
        });
      });
    },
    storageInsert: function () {
      const _this = this;
      const internal = this._internal;

      if (!this.checkWarningsBeforeCloudOp()) return;

      this.scheduleOnce('StorageInsert', function () {
        var _data = _this._getModelInitData();

        CloudStore.instance.create({
          collection: internal.collectionId,
          data: _data,
          success: function (data) {
            // Successfully created
            const m = CloudStore._fromJSON(data, internal.collectionId);
            _this.setModel(m);
            _this.sendSignalOnOutput('created');
            _this.sendSignalOnOutput('saved');
          },
          error: function (err) {
            _this.setError(err || 'Failed to insert.');
          }
        });
      });
    },
    checkWarningsBeforeCloudOp() {
      //clear all errors first
      this.clearWarnings();

      if (!this._internal.collectionId) {
        this.setError('No collection name specified');
        return false;
      }

      return true;
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
    onRelationAdd: function (key) {
      const _this = this;
      const internal = this._internal;

      this.scheduleOnce('StorageAddRelation', function () {
        if (!internal.model) return;
        var model = internal.model;

        var targetModelId = internal.relationModelIds[key];
        if (targetModelId === undefined) return;

        CloudStore.instance.addRelation({
          collection: internal.collectionId,
          objectId: model.getId(),
          key: key,
          targetObjectId: targetModelId,
          targetClass: Model.get(targetModelId)._class,
          success: function (response) {
            for (var _key in response) {
              model.set(_key, response[_key]);
            }

            // Successfully added relation
            _this.sendSignalOnOutput('$relation-added-' + key);
          },
          error: function (err) {
            _this.setError(err || 'Failed to add relation.');
          }
        });
      });
    },
    onRelationRemove: function (key) {
      const _this = this;
      const internal = this._internal;

      this.scheduleOnce('StorageRemoveRelation', function () {
        if (!internal.model) return;
        var model = internal.model;

        var targetModelId = internal.relationModelIds[key];
        if (targetModelId === undefined) return;

        CloudStore.instance.removeRelation({
          collection: internal.collectionId,
          objectId: model.getId(),
          key: key,
          targetObjectId: targetModelId,
          targetClass: Model.get(targetModelId)._class,
          success: function (response) {
            for (var _key in response) {
              model.set(_key, response[_key]);
            }

            // Successfully removed relation
            _this.sendSignalOnOutput('$relation-removed-' + key);
          },
          error: function (err) {
            _this.setError(err || 'Failed to remove relation.');
          }
        });
      });
    },
    setRelationModelId: function (key, modelId) {
      this._internal.relationModelIds[key] = modelId;
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name.startsWith('$relation-added-'))
        return this.registerOutput(name, {
          getter: function () {
            /** No needed for signals */
          }
        });

      if (name.startsWith('$relation-removed-'))
        return this.registerOutput(name, {
          getter: function () {
            /** No needed for signals */
          }
        });

      this.registerOutput(name, {
        getter: userOutputGetter.bind(this, name)
      });
    },
    _getModelInitData: function () {
      var internal = this._internal;

      var _data = {};

      // First copy values from inputs
      for (var i in internal.inputValues) {
        _data[i] = internal.inputValues[i];
      }

      // Then run initialize code
      if (this._internal.modelInitCode) {
        try {
          var initCode = new Function('initialize', this._internal.modelInitCode);
          initCode(function (data) {
            for (var key in data) {
              if (typeof data[key] === 'function') _data[key] = data[key]();
              else _data[key] = data[key];
            }
          });
        } catch (e) {
          console.log('Error while initializing model: ' + e);
        }
      }

      return _data;
    },
    setModelInitCode: function (code) {
      this._internal.modelInitCode = code;
    },
    registerInputIfNeeded: function (name) {
      var _this = this;

      if (this.hasInput(name)) {
        return;
      }

      // Relation inputs
      if (name.startsWith('$relation-add-'))
        return this.registerInput(name, {
          set: EdgeTriggeredInput.createSetter({
            valueChangedToTrue: this.onRelationAdd.bind(this, name.substring('$relation-add-'.length))
          })
        });

      if (name.startsWith('$relation-remove-'))
        return this.registerInput(name, {
          set: EdgeTriggeredInput.createSetter({
            valueChangedToTrue: this.onRelationRemove.bind(this, name.substring('$relation-remove-'.length))
          })
        });

      if (name.startsWith('$relation-modelid-'))
        return this.registerInput(name, {
          set: this.setRelationModelId.bind(this, name.substring('$relation-modelid-'.length))
        });

      const dynamicSignals = {};

      if (dynamicSignals[name])
        return this.registerInput(name, {
          set: EdgeTriggeredInput.createSetter({
            valueChangedToTrue: dynamicSignals[name]
          })
        });

      const dynamicSetters = {
        $ndlCollectionName: this.setCollectionID.bind(this),
        $ndlModelInitCode: this.setModelInitCode.bind(this)
        //       '$ndlModelValidationCode':this.setModelValidationCode.bind(this),
      };

      if (dynamicSetters[name])
        return this.registerInput(name, {
          set: dynamicSetters[name]
        });

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
  //console.log('dbmodel setter:',name,value)
  /* jshint validthis:true */
  this._internal.inputValues[name] = value;
}

function detectRename(before, after) {
  if (!before || !after) return;

  if (before.length !== after.length) return; // Must be of same length

  var res = {};
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

  return res.before && res.after ? res : undefined;
}

const defaultStorageInitCode =
  'initialize({\n' +
  '\t// Here you can initialize new models\n' +
  "\t//myProperty:'Some init value',\n" +
  "\t//anotherProperty:function() { return 'Some other value' }\n" +
  '})\n';

/*const defaultStorageValidateCode = "validation({\n" +
    "\t// Here you add validation specifications for your model properties.\n" +
    "\t//myProperty: { required:true, length:4 },\n" +
    "\t//anotherProperty: function(value) {\n" +
    "\t//\tif(value !== 'someValue) return 'Error message'\n" +
    "\t//}\n" +
    "})\n";*/

function updatePorts(nodeId, parameters, editorConnection, dbCollections) {
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
        group: 'Events',
        displayName: 'Changed ' + p,
        name: 'changed-' + p
      });
    }

    var propertyRenamed = detectRename(previousProperties[nodeId], properties);
    previousProperties[nodeId] = properties;
    if (propertyRenamed) {
      var renamed = {
        plug: 'input/output',
        patterns: ['{{*}}'],
        before: propertyRenamed.before,
        after: propertyRenamed.after
      };
    }
  }

  ports.push({
    name: '$ndlCollectionName',
    displayName: 'Class',
    group: 'General',
    type: {
      name: 'enum',
      enums:
        dbCollections !== undefined
          ? dbCollections.map((c) => {
              return { value: c.name, label: c.name };
            })
          : [],
      allowEditOnly: true
    },
    plug: 'input'
  });

  if (parameters.$ndlCollectionName && dbCollections) {
    // Fetch ports from collection keys
    var c = dbCollections.find((c) => c.name === parameters.$ndlCollectionName);
    if (c && c.schema && c.schema.properties) {
      var props = c.schema.properties;
      for (var key in props) {
        var p = props[key];
        if (ports.find((_p) => _p.name === key)) continue;

        if (p.type === 'Relation') {
          // Ports for adding / removing relation
          ports.push({
            type: 'signal',
            plug: 'input',
            group: key + ' Relation',
            name: '$relation-add-' + key,
            displayName: 'Add',
            editorName: key + ' | Add'
          });

          ports.push({
            type: 'signal',
            plug: 'input',
            group: key + ' Relation',
            name: '$relation-remove-' + key,
            displayName: 'Remove',
            editorName: key + ' | Remove'
          });

          ports.push({
            type: { name: 'string', allowConnectionsOnly: true },
            plug: 'input',
            group: key + ' Relation',
            name: '$relation-modelid-' + key,
            displayName: 'Model Id',
            editorName: key + ' | Model Id'
          });

          ports.push({
            type: 'signal',
            plug: 'output',
            group: key + ' Relation',
            name: '$relation-removed-' + key,
            displayName: 'Removed',
            editorName: key + ' | Removed'
          });

          ports.push({
            type: 'signal',
            plug: 'output',
            group: key + ' Relation',
            name: '$relation-added-' + key,
            displayName: 'Added',
            editorName: key + ' | Added'
          });
        } else {
          // Other schema type ports
          ports.push({
            type: {
              name: '*',
              allowConnectionsOnly: true
            },
            plug: 'input/output',
            group: 'Properties',
            name: key
          });

          ports.push({
            type: 'signal',
            plug: 'output',
            group: 'Events',
            displayName: 'Changed ' + key,
            name: 'changed-' + key
          });
        }
      }
    }
  }

  // Storage ports

  ports.push({
    name: '$ndlModelInitCode',
    displayName: 'Initialize',
    group: 'Scripts',
    type: {
      name: 'string',
      allowEditOnly: true,
      codeeditor: 'javascript'
    },
    default: defaultStorageInitCode,
    plug: 'input'
  });

  /*  ports.push({
        name:'$ndlModelValidationCode',
        displayName: "Validate",
        group: "Storage scripts",
        "type": {
            name: "string",
            allowEditOnly: true,
            codeeditor: "javascript"
        },
        default: defaultStorageValidateCode,   
        plug:'input'   
      })  */

  var hash = JSON.stringify(ports);
  if (modelPortsHash[nodeId] !== hash) {
    // Make sure we don't resend the same port data
    modelPortsHash[nodeId] = hash;
    editorConnection.sendDynamicPorts(nodeId, ports, { renamed: renamed });
  }
}

module.exports = {
  node: ModelNodeDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));

      node.on('parameterUpdated', function (event) {
        updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('dbCollections'));
      });

      graphModel.on('metadataChanged.dbCollections', function (data) {
        CloudStore.invalidateCollections();
        updatePorts(node.id, node.parameters, context.editorConnection, data);
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.DbModel', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('DbModel')) {
        _managePortsForNode(node);
      }
    });
  }
};
