'use strict';

const Model = require('@noodl/runtime/src/model');

function extendSetComponentObjectProperties(def) {
  const SetComponentObjectProperties = {
    name: def.name,
    displayNodeName: def.displayName,
    category: 'Component Utilities',
    color: 'component',
    docs: def.docs,
    initialize: function () {
      this._internal.inputValues = {};
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
      store: {
        type: 'signal',
        group: 'Actions',
        displayName: 'Do',
        valueChangedToTrue() {
          this.scheduleStore();
        }
      }
    },
    outputs: {
      stored: {
        type: 'signal',
        group: 'Events',
        displayName: 'Done'
      }
    },
    methods: {
      getComponentObjectId: def.getComponentObjectId,
      scheduleStore() {
        if (this.hasScheduledStore) return;
        this.hasScheduledStore = true;

        var internal = this._internal;
        this.scheduleAfterInputsHaveUpdated(() => {
          const model = Model.get(this.getComponentObjectId());
          this.hasScheduledStore = false;

          const properties = this.model.parameters.properties || '';
          const validProperties = properties.split(',');

          const keysToSet = Object.keys(internal.inputValues).filter((key) => validProperties.indexOf(key) !== -1);

          for (const i of keysToSet) {
            model.set(i, internal.inputValues[i], { resolve: true });
          }
          this.sendSignalOnOutput('stored');
        });
      },
      registerInputIfNeeded: function (name) {
        if (this.hasInput(name)) {
          return;
        }

        if (name.startsWith('prop-')) {
          const propertyName = name.substring('prop-'.length);
          this.registerInput(name, {
            set(value) {
              this._internal.inputValues[propertyName] = value;
            }
          });
        } else if (name.startsWith('type-')) {
          this.registerInput(name, {
            set(value) {}
          });
        }
      }
    }
  };

  function updatePorts(nodeId, parameters, editorConnection) {
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
    var properties = parameters.properties;
    if (properties) {
      properties = properties ? properties.split(',') : undefined;
      for (var i in properties) {
        var p = properties[i];

        // Property input
        ports.push({
          type: {
            name: parameters['type-' + p] === undefined ? '*' : parameters['type-' + p]
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

    editorConnection.sendDynamicPorts(nodeId, ports, {
      detectRenamed: {
        plug: 'input'
      }
    });
  }

  return {
    node: SetComponentObjectProperties,
    setup: function (context, graphModel) {
      if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
        return;
      }

      graphModel.on('nodeAdded.' + def.name, (node) => {
        updatePorts(node.id, node.parameters, context.editorConnection);

        node.on('parameterUpdated', (event) => {
          if (event.name === 'properties' || event.name.startsWith('type-')) {
            updatePorts(node.id, node.parameters, context.editorConnection);
          }
        });
      });
    }
  };
}

module.exports = {
  extendSetComponentObjectProperties
};
