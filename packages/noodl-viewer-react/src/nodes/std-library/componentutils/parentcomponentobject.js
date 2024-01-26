'use strict';

const { Node } = require('@noodl/runtime');
const Model = require('@noodl/runtime/src/model');
const EventEmitter = require('events').EventEmitter;

const graphEventEmitter = new EventEmitter();
graphEventEmitter.setMaxListeners(1000000);

const ParentComponentObject = {
  name: 'net.noodl.ParentComponentObject',
  displayNodeName: 'Parent Component Object',
  category: 'Component Utilities',
  color: 'component',
  docs: 'https://docs.noodl.net/nodes/component-utilities/parent-component-object',
  initialize() {
    this._internal.inputValues = {};

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

    //TODO: don't listen for delta updates when running deployed
    this.onComponentStateNodesChanged = () => {
      const id = this.findParentComponentStateModelId();

      if (this._internal.modelId !== id) {
        this._internal.modelId = id;

        if (this.isInputConnected('fetch') === false) {
          this.setModelId(this._internal.modelId);
        }
      }
    };

    graphEventEmitter.on('componentStateNodesChanged', this.onComponentStateNodesChanged);

    this.updateComponentState();
  },
  //to search up the tree the root nodes in this component must have been initialized
  //we also need the connections to be setup so we can use isInputConnected
  //nodeScopeDidInitialize takes care of that
  nodeScopeDidInitialize() {
    //FIXME: temporary hack. Our parent's node scope might not have finished created yet
    //so just wait until after this update. It'll make the parent component state
    //have a delay in propagating outputs which can cause subtle bugs.
    //The fix is to call this code when the entire node tree has been created,
    //before running updating the next update.
    if (!this._internal.modelId) {
      this.context.scheduleAfterUpdate(() => {
        this.updateComponentState();
      });
    }
  },
  getInspectInfo() {
    const model = this._internal.model;
    if (!model) return 'No parent component state found';

    const modelInfo = [{ type: 'text', value: this._internal.parentComponentName }];

    const data = this._internal.model.data;
    return modelInfo.concat(
      Object.keys(data).map((key) => {
        return { type: 'text', value: key + ': ' + data[key] };
      })
    );
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
      valueChangedToTrue: function () {
        this.setModelId(this._internal.modelId);
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
    updateComponentState() {
      this._internal.modelId = this.findParentComponentStateModelId();
      if (this.isInputConnected('fetch') === false) {
        this.setModelId(this._internal.modelId);
      }
    },
    findParentComponentStateModelId() {
      function getParentComponent(component) {
        let parent;
        if (component.getRoots().length > 0) {
          //visual
          const root = component.getRoots()[0];

          if (root.getVisualParentNode) {
            //regular visual node
            if (root.getVisualParentNode()) {
              parent = root.getVisualParentNode().nodeScope.componentOwner;
            }
          } else if (root.parentNodeScope) {
            //component instance node
            parent = component.parentNodeScope.componentOwner;
          }
        } else if (component.parentNodeScope) {
          parent = component.parentNodeScope.componentOwner;
        }

        //check that a parent exists and that the component is different
        if (parent && parent.nodeScope && parent.nodeScope.componentOwner !== component) {
          //check if parent has a Component State node
          if (parent.nodeScope.getNodesWithType('net.noodl.ComponentObject').length > 0) {
            return parent;
          }

          //if not, continue searching up the tree
          return getParentComponent(parent);
        }
      }

      const parent = getParentComponent(this.nodeScope.componentOwner);
      if (!parent) return;

      this._internal.parentComponentName = parent.name;

      return 'componentState' + parent.getInstanceId();
    },
    setModelId(id) {
      this._internal.model && this._internal.model.off('change', this._internal.onModelChangedCallback);
      this._internal.model = undefined;

      if (!id) return;

      const model = Model.get(id);
      this._internal.model = model;

      model.on('change', this._internal.onModelChangedCallback);

      for (var key in model.data) {
        if (this.hasOutput('value-' + key)) {
          this.flagOutputDirty('value-' + key);
        }
        if (this.hasOutput('changed-' + key)) {
          this.sendSignalOnOutput('changed-' + key);
        }
      }

      this.sendSignalOnOutput('changed');
      this.sendSignalOnOutput('fetched');
    },
    scheduleStore() {
      if (this.hasScheduledStore) return;
      this.hasScheduledStore = true;

      var internal = this._internal;
      this.scheduleAfterInputsHaveUpdated(() => {
        this.hasScheduledStore = false;
        if (!internal.model) return;
        for (var i in internal.inputValues) {
          internal.model.set(i, internal.inputValues[i], { resolve: true });
        }
      });
    },
    _onNodeDeleted() {
      Node.prototype._onNodeDeleted.call(this);

      graphEventEmitter.off('componentStateNodesChanged', this.onComponentStateNodesChanged);
      this._internal.model && this._internal.model.off('change', this._internal.onModelChangedCallback);
    },
    registerOutputIfNeeded(name) {
      if (this.hasOutput(name)) {
        return;
      }

      const propertyName = name.substring('value-'.length);

      this.registerOutput(name, {
        get() {
          if (!this._internal.model) return undefined;
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

            this.scheduleStore();
          }
        });
      }
    }
  }
};

function updatePorts(nodeId, parameters, editorConnection) {
  const ports = [];

  // Add value outputs
  var properties = parameters.properties && parameters.properties.split(',');
  for (var i in properties) {
    var p = properties[i];

    ports.push({
      type: {
        name: '*', //parameters['type-' + p] || 'string',
        allowConnectionsOnly: true
      },
      plug: 'input/output',
      group: 'Properties',
      name: 'value-' + p,
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

  editorConnection.sendDynamicPorts(nodeId, ports, {
    detectRenamed: {
      plug: 'input/output'
    }
  });
}

module.exports = {
  node: ParentComponentObject,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    graphModel.on('nodeAdded.net.noodl.ParentComponentObject', (node) => {
      updatePorts(node.id, node.parameters, context.editorConnection);

      node.on('parameterUpdated', (event) => {
        updatePorts(node.id, node.parameters, context.editorConnection);
      });
    });

    //TODO: handle additional delta update event:
    // - visual parent changed

    //this are the same events that'll create and delete the Comopent State instance node
    //it might not have had a chance to run yet if we're first in the event list, so
    //use a setTimeout
    graphModel.on('nodeAdded.net.noodl.ComponentObject', (node) => {
      setTimeout(() => {
        graphEventEmitter.emit('componentStateNodesChanged');
      }, 0);
    });
    graphModel.on('nodeRemoved.net.noodl.ComponentObject', (node) => {
      setTimeout(() => {
        graphEventEmitter.emit('componentStateNodesChanged');
      });
    });
  }
};
