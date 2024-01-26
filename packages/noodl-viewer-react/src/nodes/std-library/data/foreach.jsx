const { Node } = require('@noodl/runtime');
const guid = require('../../../guid');
const Collection = require('@noodl/runtime/src/collection');

const React = require('react');
const NoodlRuntime = require('@noodl/runtime');
const { useEffect } = React;

function ForEachComponent(props) {
  const { didMount, willUnmount } = props;

  useEffect(() => {
    didMount();
    return () => {
      willUnmount();
    };
  }, []);

  return null;
}

const defaultDynamicScript =
  "// Set the 'component' variable to the name of the desired component for this item.\n" +
  "// Component name must start with a '/'.\n" +
  "// A component in a sheet is referred to by '/#Sheet Name/Comopnent Name'.\n" +
  "// The data for each item is available in a variable called 'item'\n" +
  "component = '/MyComponent';";

const ForEachDefinition = {
  name: 'For Each',
  displayNodeName: 'Repeater',
  docs: 'https://docs.noodl.net/nodes/ui-controls/repeater',
  color: 'visual',
  category: 'Visual',
  dynamicports: [
    {
      name: 'conditionalports/extended',
      condition: 'templateType = explicit OR templateType NOT SET',
      inputs: ['template']
    },
    {
      name: 'conditionalports/extended',
      condition: 'templateType = dynamic',
      inputs: ['templateScript']
    }
  ],
  initialize() {
    this._internal.itemNodes = [];
    this._internal.itemOutputSignals = {};
    this._internal.itemOutputs = {};
    this._internal.collection = Collection.get(); // We keep an internal collection so we don't have to refresh all content if the input items collection changes
    this._internal.queuedOperations = [];
    this._internal.mountedOperations = [];

    // Add an item
    this._internal.collection.on('add', async (args) => {
      if (!this._internal.target) return;

      this._queueOperation(async () => {
        const baseIndex = this._internal.target.getChildren().indexOf(this) + 1;
        await this.addItem(args.item, baseIndex + args.index);
      });
    });

    // Remove an item
    this._internal.collection.on('remove', (args) => {
      this._queueOperation(() => {
        this.removeItem(args.item);
      });
    });

    // On collection changed
    this._internal.onItemsCollectionChanged = () => {
      const repeaterDisabledWhenUnmounted = NoodlRuntime.instance.getProjectSettings().repeaterDisabledWhenUnmounted;

      if (repeaterDisabledWhenUnmounted && !this.isMounted) {
        this._internal.mountedOperations.push(() => {
          this._internal.collection.set(this._internal.items);
        });
      } else {
        this._queueOperation(() => {
          this._internal.collection.set(this._internal.items);
        });
      }
    };

    this.addDeleteListener(() => {
      this._deleteAllItemNodes();
    });
  },
  inputs: {
    items: {
      group: 'Data',
      displayName: 'Items',
      type: 'array',
      set: function (value) {
        if (!value) return;
        if (value === this._internal.items) return;
        this.bindCollection(value);
        //this.scheduleRefresh();
      }
    },
    templateType: {
      group: 'Appearance',
      displayName: 'Template Type',
      type: {
        name: 'enum',
        enums: [
          { label: 'Explicit', value: 'explicit' },
          { label: 'Dynamic', value: 'dynamic' }
        ]
      },
      default: 'explicit',
      set: function (value) {
        this._internal.templateType = value;
        this.scheduleRefresh();
      }
    },
    template: {
      type: 'component',
      displayName: 'Template',
      group: 'Appearance',
      set: function (value) {
        this._internal.template = value;
        this.scheduleRefresh();
      }
    },
    templateScript: {
      type: { name: 'string', codeeditor: 'javascript', allowEditOnly: true },
      displayName: 'Script',
      group: 'Appearance',
      default: defaultDynamicScript,
      set: function (value) {
        try {
          this._internal.templateFunction = new Function('item', 'var component;' + value + ';return component;');
        } catch (e) {
          console.log(e);
          if (this.context.editorConnection) {
            this.context.editorConnection.sendWarning(
              this.nodeScope.componentOwner.name,
              this.id,
              'foreach-syntax-warning',
              { message: '<strong>Syntax</strong>: ' + e.message }
            );
          }
        }
        this.scheduleRefresh();
      }
    },
    refresh: {
      group: 'Appearance',
      displayName: 'Refresh',
      type: 'signal',
      valueChangedToTrue: function () {
        this.scheduleRefresh();
      }
    }
  },
  outputs: {
    itemActionItemId: {
      type: 'string',
      group: 'Actions',
      displayName: 'Item Id',
      getter: function () {
        return this._internal.itemActionItemId;
      }
    }
  },
  prototypeExtensions: {
    updateTarget: function (targetId) {
      this._internal.target = targetId ? this.nodeScope.getNodeWithId(targetId) : undefined;
      this.scheduleRefresh();
    },
    setNodeModel: function (nodeModel) {
      Node.prototype.setNodeModel.call(this, nodeModel);
      if (nodeModel.parent) {
        this.updateTarget(nodeModel.parent.id);
      }
      var self = this;
      nodeModel.on(
        'parentUpdated',
        function (newParent) {
          self.updateTarget(newParent ? newParent.id : undefined);
        },
        this
      );
    },
    scheduleRefresh: function () {
      var _this = this;
      var internal = this._internal;
      if (!internal.hasScheduledRefresh) {
        internal.hasScheduledRefresh = true;
        this.scheduleAfterInputsHaveUpdated(() => {
          this._queueOperation(() => {
            this.refresh();
          });
        });
      }
    },
    unbindCurrentCollection: function () {
      var collection = this._internal.items;
      if (!collection) return;

      Collection.instanceOf(collection) && collection.off('change', this._internal.onItemsCollectionChanged);
      this._internal.items = undefined;
    },
    bindCollection: function (collection) {
      var internal = this._internal;

      this.unbindCurrentCollection();

      Collection.instanceOf(collection) && collection.on('change', this._internal.onItemsCollectionChanged);

      internal.items = collection;
      this.scheduleCopyItems();
    },
    getTemplateForModel: function (model) {
      var internal = this._internal;
      if (internal.templateType === undefined || internal.templateType === 'explicit') return internal.template;

      if (!internal.templateFunction) return;
      try {
        var template = internal.templateFunction(model);
      } catch (e) {
        console.log(e);
        if (this.context.editorConnection) {
          this.context.editorConnection.sendWarning(
            this.nodeScope.componentOwner.name,
            this.id,
            'foreach-dynamic-warning',
            { message: '<strong>Dynamic template</strong>: ' + e.message }
          );
        }
      }

      //simple (and limited) way to support ./ and ../ at the start of component template names
      if (template) {
        if (template.startsWith('./')) {
          template = this.model.component.name + template.substring(1);
        }

        if (template.startsWith('../')) {
          const pathParts = this.model.component.name.split('/');
          const parentPath = pathParts.slice(0, pathParts.length - 1).join('/');
          template = parentPath + template.substring(2);
        }
      }

      return template;
    },
    _mapInputs: function (itemNode, model) {
      if (this._internal.inputMapFunc !== undefined) {
        // We have a mapping function, run the function and use the mapped values
        // as inputs
        this._internal.inputMapFunc(function (mappings) {
          for (var key in mappings) {
            if (itemNode.hasInput(key)) {
              if (typeof mappings[key] === 'function') {
                itemNode.setInputValue(key, mappings[key](model));
              } else if (typeof mappings[key] === 'string') {
                itemNode.setInputValue(key, model.get(mappings[key]));
              }
            }
          }
        }, model);
      }
    },
    addItem: async function (model, index) {
      var internal = this._internal;

      // Create a new component for this item
      var template = this.getTemplateForModel(model);
      if (!template) return;

      var itemNode = await this.nodeScope.createNode(template, guid(), {
        _forEachModel: model,
        _forEachNode: this
      });

      // Set input values for all model data, and track changes
      if (this._internal.inputMapFunc === undefined) {
        //set component inputs with values from model
        if (itemNode.hasInput('Id')) {
          itemNode.setInputValue('Id', model.getId());
        }
        if (itemNode.hasInput('id')) {
          itemNode.setInputValue('id', model.getId());
        }

        for (var inputKey in itemNode._inputs) {
          if (model.data[inputKey] !== undefined) itemNode.setInputValue(inputKey, model.data[inputKey]);
        }

        //listen to changes on model
        itemNode._forEachModelChangeListener = function (ev) {
          if (itemNode._inputs[ev.name]) itemNode.setInputValue(ev.name, ev.value);
        };
        model.on('change', itemNode._forEachModelChangeListener);

        //listen to changes to the component inputs
        itemNode.componentModel.on(
          'inputPortAdded',
          (port) => {
            if (port.name === 'id') itemNode.setInputValue('id', model.getId());
            if (port.name === 'Id') itemNode.setInputValue('Id', model.getId());

            if (model.data[port.name] !== undefined) {
              itemNode.setInputValue(port.name, model.data[port.name]);
            }
          },
          this
        );
      } else {
        // If there is a map script, then use it
        this._mapInputs(itemNode, model);
        itemNode._forEachModelChangeListener = () => this._mapInputs(itemNode, model);
        model.on('change', itemNode._forEachModelChangeListener);
      }

      // Create connections for all item output signals that we should forward
      itemNode._internal.creatorCallbacks = {
        onOutputChanged: (name, value, oldValue) => {
          if ((oldValue === false || oldValue === undefined) && value === true && internal.itemOutputSignals[name]) {
            this.itemOutputSignalTriggered(name, model, itemNode);
          }
        }
      };

      // Connect all model nodes of the component that have id type = instance
      /*var itemScopes = itemNode.nodeScope.getNodesWithType('Model')
      if(itemScopes && itemScopes.length>0) {
        for(var j = 0; j < itemScopes.length; j++) {
          itemScopes[j].hasInstanceIDType()&&itemScopes[j].setModel(model);
        }
      }*/

      // If there is a for each actions node, signal that the item has been added
      var forEachActions = itemNode.nodeScope.getNodesWithType('For Each Actions');
      for (var j = 0; j < forEachActions.length; j++) {
        forEachActions[j].signalAdded();
      }

      internal.itemNodes.push(itemNode);
      internal.target.addChild(itemNode, index);
    },
    removeItem: function (model) {
      var internal = this._internal;
      if (!internal.target) return;

      function findChild() {
        var children = internal.target.getChildren();
        for (var i in children) {
          var c = children[i];
          if (c._forEachModel === model && !c._forEachRemoveInProgress) return c;
        }
      }
      var child = findChild();
      if (!child) return;

      var forEachActions = child.nodeScope.getNodesWithType('For Each Actions');
      if (forEachActions && forEachActions.length > 0) {
        // Run a try remove on the for each actions, remove the child when completed
        child._forEachRemoveInProgress = true;
        forEachActions[0].tryRemove(() => this._deleteItem(child));
      } else {
        // There are no for each actions, just remove the item
        this._deleteItem(child);
      }

      var idx = internal.itemNodes.indexOf(child);
      idx !== -1 && internal.itemNodes.splice(idx, 1);
    },
    _deleteItem(item) {
      item._forEachModel.off('change', item._forEachModelChangeListener);

      item.model && item.model.removeListenersWithRef(this);
      item.componentModel && item.componentModel.removeListenersWithRef(this);

      const parent = item.parent;
      if (item._deleted || !parent) return;

      parent.removeChild(item);
      this.nodeScope.deleteNode(item);
    },
    _deleteAllItemNodes: function () {
      if (!this._internal.itemNodes) return;

      for (const itemNode of this._internal.itemNodes) {
        this._deleteItem(itemNode);
      }

      this._internal.itemNodes = [];
    },
    refresh: async function () {
      var internal = this._internal;
      internal.hasScheduledRefresh = false;
      if (!(internal.template || internal.templateFunction) || !internal.items) return;

      this._deleteAllItemNodes();

      //check if we have a target to add nodes to
      if (!internal.target) return;

      // figure out our index in our target
      const baseIndex = this._internal.target.getChildren().indexOf(this) + 1;

      // Iterate over all models and create items
      for (var i = 0; i < internal.collection.size(); i++) {
        var model = internal.collection.get(i);

        await this.addItem(model, baseIndex + i);
      }
    },
    _queueOperation(op) {
      this._internal.queuedOperations.push(op);
      this._runQueueOperations();
    },
    async _runQueueOperations() {
      if (this.runningOperations) {
        return;
      }
      this.runningOperations = true;

      const repeaterCreateComponentsAsync = NoodlRuntime.instance.getProjectSettings().repeaterCreateComponentsAsync;

      if (repeaterCreateComponentsAsync) {
        //create items in chunks of roughly 25ms at a time
        //so basically trying to keep ~30 fps
        const runOps = async () => {
          const start = performance.now();

          while (this._internal.queuedOperations.length && performance.now() - start < 25) {
            const op = this._internal.queuedOperations.shift();
            await op();
          }

          if (this._internal.queuedOperations.length) {
            setTimeout(runOps, 0);
          } else {
            this.runningOperations = false;
          }
        };

        runOps();
      } else {
        while (this._internal.queuedOperations.length) {
          const op = this._internal.queuedOperations.shift();
          await op();
        }

        this.runningOperations = false;
      }
    },
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
      this._internal.queuedOperations.length = 0; //delete all queued operations
      this.unbindCurrentCollection();
    },
    render() {
      return <ForEachComponent key={this.id} didMount={() => this.didMount()} willUnmount={() => this.willUnmount()} />;
    },
    didMount() {
      this.isMounted = true;

      for (const op of this._internal.mountedOperations) {
        this._queueOperation(op);
      }
      this._internal.mountedOperations = [];
    },
    willUnmount() {
      this.isMounted = false;
    },
    getItemActionParameter: function (name) {
      if (!this._internal.itemActionParameters) return;
      return this._internal.itemActionParameters[name];
    },
    scheduleCopyItems: function () {
      if (this._internal.hasScheduledCopyItems) return;
      this._internal.hasScheduledCopyItems = true;
      this.scheduleAfterInputsHaveUpdated(() => {
        this._internal.hasScheduledCopyItems = false;

        if (this._internal.items === undefined) return;

        const repeaterDisabledWhenUnmounted = NoodlRuntime.instance.getProjectSettings().repeaterDisabledWhenUnmounted;

        if (repeaterDisabledWhenUnmounted && !this.isMounted) {
          this._internal.mountedOperations.push(() => {
            this._internal.collection.set(this._internal.items);
          });
        } else {
          this._internal.collection.set(this._internal.items);
        }
      });
    },
    itemOutputSignalTriggered: function (name, model, itemNode) {
      this._internal.itemActionItemId = model.getId();
      this._internal.itemActionSignal = name;
      this.flagOutputDirty('itemActionItemId');

      // Send signal and update item outputs after they have been correctly updated
      if (!this._internal.hasScheduledTriggerItemOutputSignal) {
        this._internal.hasScheduledTriggerItemOutputSignal = true;
        this.context.scheduleAfterUpdate(() => {
          this._internal.hasScheduledTriggerItemOutputSignal = false;
          for (var key in itemNode._outputs) {
            var _output = 'itemOutput-' + key;
            if (this.hasOutput(_output)) {
              this._internal.itemOutputs[key] = itemNode._outputs[key].value;
              this.flagOutputDirty(_output);
            }
          }
          this.sendSignalOnOutput('itemOutputSignal-' + this._internal.itemActionSignal);
        });
      }
    },
    getItemOutput: function (name) {
      return this._internal.itemOutputs[name];
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name.startsWith('itemOutputSignal-')) {
        this._internal.itemOutputSignals[name.substring('itemOutputSignal-'.length)] = true;
        this.registerOutput(name, {
          getter: function () {
            /** No needed for signals */
          }
        });
      } else if (name.startsWith('itemOutput-'))
        this.registerOutput(name, {
          getter: this.getItemOutput.bind(this, name.substring('itemOutput-'.length))
        });
    },
    setInputMappingScript: function (value) {
      if (this.context.editorConnection) {
        this.context.editorConnection.clearWarning(
          this.nodeScope.componentOwner.name,
          this.id,
          'foreach-inputmapping-warning'
        );
      }

      this._internal.inputMappingScript = value;

      if (this._internal.inputMappingScript) {
        try {
          this._internal.inputMapFunc = new Function('map', 'object', this._internal.inputMappingScript);
        } catch (e) {
          this._internal.inputMapFunc = undefined;
          if (this.context.editorConnection) {
            this.context.editorConnection.sendWarning(
              this.nodeScope.componentOwner.name,
              this.id,
              'foreach-inputmapping-warning',
              { message: '<strong>Input mapping</strong>: ' + e.message }
            );
          }
        }
      } else {
        this._internal.inputMapFunc = undefined;
      }

      this.scheduleRefresh();
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name === 'inputMappingScript')
        return this.registerInput(name, {
          set: this.setInputMappingScript.bind(this)
        });
    }
  }
};

function _typeName(t) {
  if (typeof t === 'object') return t.name;
  else return t;
}

const defaultMapCode =
  '// Here you add mappings between the properties of the item objects and the inputs of the components.\n' +
  "// 'myComponentInput': 'myObjectProperty',\n" +
  "// 'anotherComponentInput': function () { return object.get('someProperty') + ' ' + object.get('otherProp') }\n" +
  '// These are the default mappings based on the selected template component.\n' +
  'map({\n' +
  '{{#mappings}}' +
  '})\n';

module.exports = {
  ForEachComponent: ForEachComponent,
  node: ForEachDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      function _collectPortsInTemplateComponent() {
        var templateComponentName = node.parameters.template;
        if (templateComponentName === undefined) return;

        var ports = [];
        var c = graphModel.components[templateComponentName];
        if (c === undefined) return;

        // Collect item outputs and signals
        for (var outputName in c.outputPorts) {
          var o = c.outputPorts[outputName];
          if (_typeName(o.type) === 'signal') {
            ports.push({
              name: 'itemOutputSignal-' + outputName,
              displayName: outputName,
              type: 'signal',
              plug: 'output',
              group: 'Item Signals'
            });
          } else {
            ports.push({
              name: 'itemOutput-' + outputName,
              displayName: outputName,
              type: o.type,
              plug: 'output',
              group: 'Item Outputs'
            });
          }
        }

        // Collect default mappigs for template component inputs
        var defaultMappings = '';
        for (var inputName in c.inputPorts) {
          var o = c.inputPorts[inputName];
          if (_typeName(o.type) !== 'signal') {
            defaultMappings += "\t'" + inputName + "': '" + inputName + "',\n";
          }
        }

        ports.push({
          name: 'inputMappingScript',
          type: { name: 'string', codeeditor: 'javascript' },
          displayName: 'Script',
          group: 'Input Mapping',
          default: defaultMapCode.replace('{{#mappings}}', defaultMappings),
          plug: 'input'
        });

        context.editorConnection.sendDynamicPorts(node.id, ports, {
          detectRenamed: {
            plug: 'output',
            prefix: 'itemOutput'
          }
        });
      }

      function _trackComponentOutputs(componentName) {
        if (componentName === undefined) return;
        var c = graphModel.components[componentName];
        if (c === undefined) return;

        c.on('outputPortAdded', _collectPortsInTemplateComponent);
        c.on('outputPortRemoved', _collectPortsInTemplateComponent);
        c.on('outputPortTypesUpdated', _collectPortsInTemplateComponent);

        c.on('inputPortTypesUpdated', _collectPortsInTemplateComponent);
        c.on('inputPortAdded', _collectPortsInTemplateComponent);
        c.on('inputPortRemoved', _collectPortsInTemplateComponent);
      }

      _collectPortsInTemplateComponent();
      _trackComponentOutputs(node.parameters.template);
      node.on('parameterUpdated', function (event) {
        if (event.name === 'template') {
          _collectPortsInTemplateComponent();
          _trackComponentOutputs(node.parameters.template);
        }
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.For Each', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('For Each')) {
        _managePortsForNode(node);
      }
    });
  }
};
