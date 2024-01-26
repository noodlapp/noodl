'use strict';

const { Node } = require('@noodl/runtime');
const Model = require('@noodl/runtime/src/model');

const ComponentObject = {
  name: 'net.noodl.ComponentObject',
  displayNodeName: 'Component Object',
  category: 'Component Utilities',
  color: 'component',
  docs: 'https://docs.noodl.net/nodes/component-utilities/component-object',
  initialize: function () {
    this._internal.inputValues = {};
    this._internal.dirtyValues = {};

    this._internal.onModelChangedCallback = (args) => {
      if (this.isInputConnected('fetch') !== false) return;

      if (this.hasOutput('value-' + args.name)) {
        this.flagOutputDirty('value-' + args.name);
      }

      if (this.hasOutput('changed-' + args.name)) {
        this.sendSignalOnOutput('changed-' + args.name);
      }

      this.sendSignalOnOutput('changed');
    };

    const model = Model.get('componentState' + this.nodeScope.componentOwner.getInstanceId());
    this._internal.model = model;

    model.on('change', this._internal.onModelChangedCallback);
  },
  getInspectInfo() {
    return {
      type: 'value',
      value: this._internal.model.data
    };
  },
  inputs: {
    properties: {
      type: {
        name: 'stringlist',
        allowEditOnly: true
      },
      displayName: 'Properties',
      group: 'Properties',
      set(value) {}
    },
    fetch: {
      displayName: 'Fetch',
      group: 'Actions',
      valueChangedToTrue() {
        this.scheduleFetch();
      }
    }
  },
  outputs: {
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
  methods: {
    scheduleStore() {
      if (this.hasScheduledStore) return;
      this.hasScheduledStore = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(() => {
        this.hasScheduledStore = false;
        for (var i in internal.dirtyValues) {
          internal.model.set(i, internal.inputValues[i], { resolve: true });
        }
        internal.dirtyValues = {};
      });
    },
    scheduleFetch() {
      if (this.hasScheduledFetch) return;
      this.hasScheduledFetch = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.hasScheduledFetch = false;
        this.fetch();
      });
    },
    fetch() {
      for (var key in this._internal.model.data) {
        if (this.hasOutput('value-' + key)) {
          this.flagOutputDirty('value-' + key);
          if (this.hasOutput('changed-' + key)) {
            this.sendSignalOnOutput('changed-' + key);
          }
        }
      }
      this.sendSignalOnOutput('fetched');
    },
    _onNodeDeleted() {
      Node.prototype._onNodeDeleted.call(this);
      this._internal.model.off('change', this._internal.onModelChangedCallback);
    },
    registerOutputIfNeeded(name) {
      if (this.hasOutput(name)) {
        return;
      }

      const split = name.split('-');
      const propertyName = split[split.length - 1];

      this.registerOutput(name, {
        get() {
          return this._internal.model.get(propertyName, { resolve: true });
        }
      });
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('value-')) {
        const propertyName = name.substring('value-'.length);
        this.registerInput(name, {
          set(value) {
            this._internal.inputValues[propertyName] = value;
            this._internal.dirtyValues[propertyName] = true;

            this.scheduleStore();
          }
        });
      }
      /*  else if (name.startsWith('start-value-')) {
                this.registerInput(name, {
                    set(value) {
                        this._internal.model.set(propertyName, value)
                    }
                });
            }
            else if (name.startsWith('type-')) {
                this.registerInput(name, {
                    set(value) {}
                });
            }*/
    }
  }
};

function updatePorts(nodeId, parameters, editorConnection) {
  const ports = [];

  // Add value outputs
  if (parameters.properties) {
    var properties = parameters.properties.split(',');
    for (var i in properties) {
      var p = properties[i];

      ports.push({
        type: {
          name: '*',
          allowConnectionsOnly: true
        },
        plug: 'input/output',
        group: 'Properties',
        name: 'value-' + p,
        displayName: p
      });
      /*   ports.push({
                type: {
                    name: parameters['type-' + p] || 'string',
                    allowEditOnly: true
                },
                plug: 'input',
                group: 'Start Values',
                name: 'start-value-' + p,
                displayName: p
            });

            ports.push({
                type: {
                    name: 'enum',
                    enums: [
                        { label: 'Number', value: 'number' },
                        { label: 'String', value: 'string' },
                        { label: 'Boolean', value: 'boolean' },
                        { label: 'Color', value: 'color' },
                        { label: 'Image', value: 'image' }
                    ],
                    allowEditOnly: true
                },
                default: 'string',
                plug: 'input',
                group: 'Types',
                displayName: p,
                name: 'type-' + p,
            });*/

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
  node: ComponentObject,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    graphModel.on('nodeAdded.net.noodl.ComponentObject', (node) => {
      updatePorts(node.id, node.parameters, context.editorConnection);

      node.on('parameterUpdated', (event) => {
        if (event.name === 'properties') {
          updatePorts(node.id, node.parameters, context.editorConnection);
        }
      });
    });
  }
};
