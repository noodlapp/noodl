'use strict';

const Collection = require('../../../collection');
const Model = require('../../../model');

function _addBaseInfo(def) {
  Object.assign(def.node, {
    category: 'Data',
    color: 'data'
  });
}

function _addModelId(def, opts) {
  const _includeInputs = opts === undefined || opts.includeInputs;
  const _includeOutputs = opts === undefined || opts.includeOutputs;

  Object.assign(def.node, {
    inputs: def.node.inputs || {},
    outputs: def.node.outputs || {},
    methods: def.node.methods || {}
  });

  if (_includeInputs) {
    Object.assign(def.node, {
      usePortAsLabel: 'modelId'
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
    setModelID: function (id) {
      var model = (this.nodeScope.modelScope || Model).get(id);
      this.setModel(model);
    },
    setModel: function (model) {
      this._internal.model = model;
      this.flagOutputDirty('id');
    }
  });

  //Inspect model
  if (!def.node.getInspectInfo) {
    def.node.getInspectInfo = function () {
      const model = this._internal.model;
      if (!model) return '[No Object]';

      return [
        { type: 'text', value: 'Id: ' + model.getId() },
        { type: 'value', value: model.data }
      ];
    };
  }
}

function _addInputProperties(def) {
  var _def = { node: Object.assign({}, def.node), setup: def.setup };
  var _methods = Object.assign({}, def.node.methods);

  Object.assign(def.node, {
    inputs: def.node.inputs || {},
    outputs: def.node.outputs || {},
    methods: def.node.methods || {}
  });

  Object.assign(def, {
    setup: function (context, graphModel) {
      if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
        return;
      }

      graphModel.on('nodeAdded.' + def.node.name, function (node) {
        function _updatePorts() {
          var ports = [];

          const _types = [
            { label: 'String', value: 'string' },
            { label: 'Boolean', value: 'boolean' },
            { label: 'Number', value: 'number' },
            { label: 'Date', value: 'date' },
            { label: 'Array', value: 'array' },
            { label: 'Object', value: 'object' },
            { label: 'Any', value: '*' }
          ];

          // Add value outputs
          var properties = node.parameters.properties;
          if (properties) {
            properties = properties ? properties.split(',') : undefined;
            for (var i in properties) {
              var p = properties[i];

              // Property input
              ports.push({
                type: {
                  name: node.parameters['type-' + p] === undefined ? '*' : node.parameters['type-' + p]
                },
                plug: 'input',
                group: 'Property Values',
                displayName: p,
                //  editorName:p,
                name: 'prop-' + p
              });

              // Property type
              ports.push({
                type: {
                  name: 'enum',
                  enums: _types,
                  allowEditOnly: true
                },
                plug: 'input',
                group: 'Property Types',
                displayName: p,
                default: '*',
                name: 'type-' + p
              });
            }
          }

          context.editorConnection.sendDynamicPorts(node.id, ports, {
            detectRenamed: {
              plug: 'input'
            }
          });
        }

        _updatePorts();

        node.on('parameterUpdated', function (event) {
          _updatePorts();
        });
      });

      _def.setup && _def.setup(context, graphModel);
    }
  });

  // Initilize
  Object.assign(def.node, {
    initialize: function () {
      var internal = this._internal;
      internal.inputValues = {};
      internal.inputTypes = {};

      _def.node.initialize && _def.node.initialize.call(this);
    }
  });

  // Outputs
  Object.assign(def.node.outputs, {});

  // Inputs
  Object.assign(def.node.inputs, {
    properties: {
      type: { name: 'stringlist', allowEditOnly: true },
      displayName: 'Properties',
      group: 'Properties to set',
      set: function (value) {}
    }
  });

  // Methods
  Object.assign(def.node.methods, {
    _pushInputValues: function (model) {
      var internal = this._internal;

      const _defaultValueForType = {
        boolean: false,
        string: '',
        number: 0,
        date: new Date()
      };

      const _allKeys = {};
      for (const key in internal.inputTypes) _allKeys[key] = true;
      for (const key in internal.inputValues) _allKeys[key] = true;

      const properties = this.model.parameters.properties || '';

      const validProperties = properties.split(',');

      const keysToSet = Object.keys(_allKeys).filter((key) => validProperties.indexOf(key) !== -1);

      for (const i of keysToSet) {
        var value = internal.inputValues[i];

        if (value !== undefined) {
          //Parse array types with string as javascript
          if (internal.inputTypes[i] !== undefined && internal.inputTypes[i] === 'array' && typeof value === 'string') {
            this.context.editorConnection.clearWarning(
              this.nodeScope.componentOwner.name,
              this.id,
              'invalid-array-' + i
            );

            try {
              value = eval(value); //this might be static data in the form of javascript
            } catch (e) {
              if (value.indexOf('[') !== -1 || value.indexOf('{') !== -1) {
                this.context.editorConnection.sendWarning(
                  this.nodeScope.componentOwner.name,
                  this.id,
                  'invalid-array-' + i,
                  {
                    showGlobally: true,
                    message: 'Invalid array<br>' + e.toString()
                  }
                );
                value = [];
              } else {
                //backwards compability with how this node used to work
                value = Collection.get(value);
              }
            }
          }
          // Resolve object  from IDs
          if (
            internal.inputTypes[i] !== undefined &&
            internal.inputTypes[i] === 'object' &&
            typeof value === 'string'
          ) {
            value = (this.nodeScope.modelScope || Model).get(value);
          }

          model.set(i, value, { resolve: true });
        } else {
          model.set(i, _defaultValueForType[internal.inputTypes[i]], {
            resolve: true
          });
        }
      }
    },
    scheduleStore: function () {
      if (this.hasScheduledStore) return;
      this.hasScheduledStore = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(() => {
        this.hasScheduledStore = false;
        if (!internal.model) return;

        this._pushInputValues(internal.model);

        this.sendSignalOnOutput('stored');
      });
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('prop-'))
        this.registerInput(name, {
          set: this._setInputValue.bind(this, name.substring('prop-'.length))
        });

      if (name.startsWith('type-'))
        this.registerInput(name, {
          set: this._setInputType.bind(this, name.substring('type-'.length))
        });

      _methods && _methods.registerInputIfNeeded && _def.node.methods.registerInputIfNeeded.call(this, name);
    },
    _setInputValue: function (name, value) {
      this._internal.inputValues[name] = value;
    },
    _setInputType: function (name, value) {
      this._internal.inputTypes[name] = value;
    }
  });
}

module.exports = {
  addInputProperties: _addInputProperties,
  addModelId: _addModelId,
  addBaseInfo: _addBaseInfo
};
