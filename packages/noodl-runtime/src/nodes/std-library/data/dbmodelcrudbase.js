'use strict';

const Model = require('../../../model');
const CloudStore = require('../../../api/cloudstore');

function _addBaseInfo(def, opts) {
  const _includeInputProperties = opts === undefined || opts.includeInputProperties;
  const _includeRelations = opts !== undefined && opts.includeRelations;

  Object.assign(def.node, {
    category: 'Data',
    color: 'data',
    inputs: def.node.inputs || {},
    outputs: def.node.outputs || {},
    methods: def.node.methods || {}
  });

  // Outputs
  Object.assign(def.node.outputs, {
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
  });

  // Methods
  Object.assign(def.node.methods, {
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
    checkWarningsBeforeCloudOp() {
      //clear all errors first
      this.clearWarnings();

      if (!this._internal.collectionId) {
        this.setError('No class name specified');
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
    }
  });

  // Setup
  Object.assign(def, {
    setup: function (context, graphModel) {
      if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
        return;
      }

      function _managePortsForNode(node) {
        function _updatePorts() {
          var ports = [];

          const dbCollections = graphModel.getMetaData('dbCollections');
          const systemCollections = graphModel.getMetaData('systemCollections');

          const _systemClasses = [
            { label: 'User', value: '_User' },
            { label: 'Role', value: '_Role' }
          ];

          const parameters = node.parameters;

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

          if (_includeRelations && parameters.collectionName && dbCollections) {
            // Fetch ports from collection keys
            var c = dbCollections.find((c) => c.name === parameters.collectionName);
            if (c === undefined && systemCollections)
              c = systemCollections.find((c) => c.name === parameters.collectionName);
            if (c && c.schema && c.schema.properties) {
              const props = c.schema.properties;
              const enums = Object.keys(props)
                .filter((key) => props[key].type === 'Relation')
                .map((key) => ({ label: key, value: key }));

              ports.push({
                name: 'relationProperty',
                displayName: 'Relation',
                group: 'General',
                type: { name: 'enum', enums: enums, allowEditOnly: true },
                plug: 'input'
              });
            }
          }

          if (_includeInputProperties && parameters.collectionName && dbCollections) {
            const _typeMap = {
              String: 'string',
              Boolean: 'boolean',
              Number: 'number',
              Date: 'date'
            };

            // Fetch ports from collection keys
            var c = dbCollections.find((c) => c.name === parameters.collectionName);
            if (c === undefined && systemCollections)
              c = systemCollections.find((c) => c.name === parameters.collectionName);
            if (c && c.schema && c.schema.properties) {
              var props = c.schema.properties;
              for (var key in props) {
                var p = props[key];
                if (ports.find((_p) => _p.name === key)) continue;

                ports.push({
                  type: {
                    name: _typeMap[p.type] ? _typeMap[p.type] : '*'
                  },
                  plug: 'input',
                  group: 'Properties',
                  name: 'prop-' + key,
                  displayName: key
                });
              }
            }
          }

          def._additionalDynamicPorts && def._additionalDynamicPorts(node, ports, graphModel);

          context.editorConnection.sendDynamicPorts(node.id, ports);
        }

        _updatePorts();

        node.on('parameterUpdated', function (event) {
          _updatePorts();
        });

        graphModel.on('metadataChanged.dbCollections', function (data) {
          CloudStore.invalidateCollections();
          _updatePorts();
        });

        graphModel.on('metadataChanged.systemCollections', function (data) {
          CloudStore.invalidateCollections();
          _updatePorts();
        });
      }

      graphModel.on('editorImportComplete', () => {
        graphModel.on('nodeAdded.' + def.node.name, function (node) {
          _managePortsForNode(node);
        });

        for (const node of graphModel.getNodesWithType(def.node.name)) {
          _managePortsForNode(node);
        }
      });
    }
  });
}

function _addModelId(def, opts) {
  var _def = { node: Object.assign({}, def.node), setup: def.setup };
  var _methods = Object.assign({}, def.node.methods);

  const _includeInputs = opts === undefined || opts.includeInputs;
  const _includeOutputs = opts === undefined || opts.includeOutputs;

  Object.assign(def.node, {
    inputs: def.node.inputs || {},
    outputs: def.node.outputs || {},
    methods: def.node.methods || {}
  });

  if (_includeInputs) {
    Object.assign(def.node, {
      usePortAsLabel: 'collectionName'
    });

    def.node.dynamicports = (def.node.dynamicports || []).concat([
      {
        name: 'conditionalports/extended',
        condition: 'idSource = explicit OR idSource NOT SET',
        inputs: ['modelId']
      }
    ]);

    // Inputs
    Object.assign(def.node.inputs, {
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
        tooltip:
          'Choose if you want to specify the Id explicitly, \n or if you want it to be that of the current record in a repeater.',
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
          if (value instanceof Model) value = value.getId(); // Can be passed as model as well
          this._internal.modelId = value; // Wait to fetch data
          this.setModelID(value);
        }
      }
    });
  }

  // Outputs
  if (_includeOutputs) {
    Object.assign(def.node.outputs, {
      id: {
        type: 'string',
        displayName: 'Id',
        group: 'General',
        getter: function () {
          return this._internal.model ? this._internal.model.getId() : this._internal.modelId;
        }
      }
    });
  }

  // Methods
  Object.assign(def.node.methods, {
    setCollectionID: function (id) {
      this._internal.collectionId = id;
      this.clearWarnings();
    },
    setModelID: function (id) {
      var model = (this.nodeScope.modelScope || Model).get(id);
      this.setModel(model);
    },
    setModel: function (model) {
      this._internal.model = model;
      this.flagOutputDirty('id');
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name === 'collectionName')
        this.registerInput(name, {
          set: this.setCollectionID.bind(this)
        });

      _methods && _methods.registerInputIfNeeded && _methods.registerInputIfNeeded.call(this, name);
    }
  });
}

function _addInputProperties(def) {
  var _def = { node: Object.assign({}, def.node), setup: def.setup };
  var _methods = Object.assign({}, def.node.methods);

  Object.assign(def.node, {
    inputs: def.node.inputs || {},
    outputs: def.node.outputs || {},
    methods: def.node.methods || {}
  });

  Object.assign(def.node, {
    initialize: function () {
      var internal = this._internal;
      internal.inputValues = {};

      _def.node.initialize && _def.node.initialize.call(this);
    }
  });

  // Outputs
  Object.assign(def.node.outputs, {});

  // Inputs
  Object.assign(def.node.inputs, {});

  // Methods
  Object.assign(def.node.methods, {
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('prop-'))
        this.registerInput(name, {
          set: this._setInputValue.bind(this, name.substring('prop-'.length))
        });

      _methods && _methods.registerInputIfNeeded && _methods.registerInputIfNeeded.call(this, name);
    },
    _setInputValue: function (name, value) {
      this._internal.inputValues[name] = value;
    }
  });
}

function _addRelationProperty(def) {
  var _def = { node: Object.assign({}, def.node), setup: def.setup };
  var _methods = Object.assign({}, def.node.methods);

  Object.assign(def.node, {
    inputs: def.node.inputs || {},
    outputs: def.node.outputs || {},
    methods: def.node.methods || {}
  });

  // Inputs
  Object.assign(def.node.inputs, {
    targetId: {
      type: { name: 'string', allowConnectionsOnly: true },
      displayName: 'Target Record Id',
      group: 'General',
      set: function (value) {
        this._internal.targetModelId = value;
      }
    }
  });

  // Methods
  Object.assign(def.node.methods, {
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name === 'relationProperty')
        this.registerInput(name, {
          set: this.setRelationProperty.bind(this)
        });

      _methods && _methods.registerInputIfNeeded && _methods.registerInputIfNeeded.call(this, name);
    },
    setRelationProperty: function (value) {
      this._internal.relationProperty = value;
    }
  });
}

function _getCurrentUser(modelScope) {
  if (typeof _noodl_cloud_runtime_version === 'undefined') {
    // We are running in browser, try to find the current user

    var _cu = localStorage['Parse/' + CloudStore.instance.appId + '/currentUser'];
    if (_cu !== undefined) {
      let cu;
      try {
        cu = JSON.parse(_cu);
      } catch (e) {}

      return cu !== undefined ? cu.objectId : undefined;
    }
  } else {
    // Assume we are running in cloud runtime
    const request = modelScope.get('Request');
    return request.UserId;
  }
}

function _addAccessControl(def) {
  var _def = { node: Object.assign({}, def.node), setup: def.setup };
  var _methods = Object.assign({}, def.node.methods);

  Object.assign(def.node, {
    inputs: def.node.inputs || {},
    outputs: def.node.outputs || {},
    methods: def.node.methods || {}
  });

  Object.assign(def.node, {
    initialize: function () {
      var internal = this._internal;
      internal.accessControl = {};

      _def.node.initialize && _def.node.initialize.call(this);
    }
  });

  // Inputs
  Object.assign(def.node.inputs, {
    accessControl: {
      type: { name: 'proplist', autoName: 'Rule', allowEditOnly: true },
      index: 1000,
      displayName: 'Access Control Rules',
      group: 'Access Control Rules',
      set: function (value) {
        this._internal.accessControlRules = value;
      }
    }
  });

  // Dynamic ports
  const _super = def._additionalDynamicPorts;
  def._additionalDynamicPorts = function (node, ports, graphModel) {
    if (node.parameters['accessControl'] !== undefined && node.parameters['accessControl'].length > 0) {
      node.parameters['accessControl'].forEach((ac) => {
        const prefix = 'acl-' + ac.id;
        // User or role?
        ports.push({
          name: prefix + '-target',
          displayName: 'Target',
          editorName: ac.label + ' | Target',
          plug: 'input',
          type: {
            name: 'enum',
            enums: [
              { value: 'user', label: 'User' },
              { value: 'everyone', label: 'Everyone' },
              { value: 'role', label: 'Role' }
            ],
            allowEditOnly: true
          },
          group: ac.label + ' Access Rule',
          default: 'user',
          parent: 'accessControl',
          parentItemId: ac.id
        });

        if (node.parameters[prefix + '-target'] === 'role') {
          ports.push({
            name: prefix + '-role',
            displayName: 'Role',
            editorName: ac.label + ' | Role',
            group: ac.label + ' Access Rule',
            plug: 'input',
            type: 'string',
            parent: 'accessControl',
            parentItemId: ac.id
          });
        } else if (
          node.parameters[prefix + '-target'] === undefined ||
          node.parameters[prefix + '-target'] === 'user'
        ) {
          ports.push({
            name: prefix + '-userid',
            displayName: 'User Id',
            group: ac.label + ' Access Rule',
            editorName: ac.label + ' | User Id',
            plug: 'input',
            type: { name: 'string', allowConnectionsOnly: true },
            parent: 'accessControl',
            parentItemId: ac.id
          });
        }

        // Read
        ports.push({
          name: prefix + '-read',
          displayName: 'Read',
          editorName: ac.label + ' | Read',
          group: ac.label + ' Access Rule',
          plug: 'input',
          type: { name: 'boolean' },
          default: true,
          parent: 'accessControl',
          parentItemId: ac.id
        });

        // Write
        ports.push({
          name: prefix + '-write',
          displayName: 'Write',
          editorName: ac.label + ' | Write',
          group: ac.label + ' Access Rule',
          plug: 'input',
          type: { name: 'boolean' },
          default: true,
          parent: 'accessControl',
          parentItemId: ac.id
        });
      });
    }

    _super && _super(node, ports, graphModel);
  };

  // Methods
  Object.assign(def.node.methods, {
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('acl-'))
        this.registerInput(name, {
          set: this.setAccessControl.bind(this, name)
        });

      _methods && _methods.registerInputIfNeeded && _methods.registerInputIfNeeded.call(this, name);
    },
    _getACL: function () {
      let acl = {};

      function _rule(rule) {
        return {
          read: rule.read === undefined ? true : rule.read,
          write: rule.write === undefined ? true : rule.write
        };
      }

      const currentUserId = _getCurrentUser(this.nodeScope.modelScope);

      if (this._internal.accessControlRules !== undefined) {
        this._internal.accessControlRules.forEach((r) => {
          const rule = this._internal.accessControl[r.id];

          if (rule === undefined) {
            const userId = currentUserId;
            if (userId !== undefined) acl[userId] = { write: true, read: true };
          } else if (rule.target === 'everyone') {
            acl['*'] = _rule(rule);
          } else if (rule.target === 'user') {
            const userId = rule.userid || currentUserId;
            acl[userId] = _rule(rule);
          } else if (rule.target === 'role') {
            acl['role:' + rule.role] = _rule(rule);
          }
        });
      }

      return Object.keys(acl).length > 0 ? acl : undefined;
    },
    setAccessControl: function (name, value) {
      const _parts = name.split('-');

      if (this._internal.accessControl[_parts[1]] === undefined) this._internal.accessControl[_parts[1]] = {};
      this._internal.accessControl[_parts[1]][_parts[2]] = value;
    }
  });
}

module.exports = {
  addInputProperties: _addInputProperties,
  addModelId: _addModelId,
  addBaseInfo: _addBaseInfo,
  addRelationProperty: _addRelationProperty,
  addAccessControl: _addAccessControl
};
