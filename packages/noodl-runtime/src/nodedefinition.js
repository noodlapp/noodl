const Node = require('./node'),
  EdgeTriggeredInput = require('./edgetriggeredinput');

function registerInput(object, metadata, name, input) {
  if (object.hasOwnProperty(name)) {
    throw new Error('Input property ' + name + ' already registered');
  }

  if (!input.set && !input.valueChangedToTrue) {
    input.set = () => {};
  }

  if (input.set) {
    object[name] = {
      set: input.set
    };

    //types to keep in the input on the node instances
    //color and textStyles are used for style updates
    //array is for supporting eval:ing strings
    const typesToSaveInInput = ['color', 'textStyle', 'array'];

    typesToSaveInInput.forEach((type) => {
      if (input.type && (input.type === type || input.type.name === type)) {
        object[name].type = type;
      }
    });
  }

  if (input.setUnitType) {
    object[name].setUnitType = input.setUnitType;
  }

  metadata.inputs[name] = {
    displayName: input.displayName,
    editorName: input.editorName,
    group: input.group,
    type: input.type,
    default: input.default,
    index: input.index,
    exportToEditor: input.hasOwnProperty('exportToEditor') ? input.exportToEditor : true,
    inputPriority: input.inputPriority || 0,
    tooltip: input.tooltip,
    tab: input.tab,
    popout: input.popout,
    allowVisualStates: input.allowVisualStates,
    nodeDoubleClickAction: input.nodeDoubleClickAction
  };

  if (input.valueChangedToTrue) {
    metadata.inputs[name].type = {
      name: 'signal',
      allowConnectionsOnly: true
    };
  }
}

function registerInputs(object, metadata, inputs) {
  Object.keys(inputs).forEach(function (inputName) {
    registerInput(object, metadata, inputName, inputs[inputName]);
  });
}

function registerNumberedInputs(node, numberedInputs) {
  for (const inputName of Object.keys(numberedInputs)) {
    registerNumberedInput(node, inputName, numberedInputs[inputName]);
  }
}

function registerNumberedInput(node, name, input) {
  const oldRegisterInputIfNeeded = node.registerInputIfNeeded;

  node.registerInputIfNeeded = function (inputName) {
    if (oldRegisterInputIfNeeded) {
      oldRegisterInputIfNeeded.call(node, inputName);
    }

    if (node.hasInput(inputName) || !inputName.startsWith(name)) {
      return;
    }

    const index = Number(inputName.slice(name.length + 1)); // inputName is "nameOfInput xxx" where xxx is the index

    node.registerInput(inputName, {
      type: input.type,
      set: input.createSetter.call(node, index)
    });
  };
}

function registerOutputsMetadata(metadata, outputs) {
  Object.keys(outputs).forEach(function (name) {
    var output = outputs[name];

    metadata.outputs[name] = {
      displayName: output.displayName,
      editorName: output.editorName,
      group: output.group,
      type: output.type,
      index: output.index,
      exportToEditor: output.hasOwnProperty('exportToEditor') ? output.exportToEditor : true
    };
  });
}

function initializeDefaultValues(defaultValues, inputsMetadata) {
  Object.keys(inputsMetadata).forEach((name) => {
    const defaultValue = inputsMetadata[name].default;
    if (defaultValue === undefined) return;

    if (inputsMetadata[name].type.defaultUnit) {
      defaultValues[name] = {
        unit: inputsMetadata[name].type.defaultUnit,
        value: defaultValue
      };
    } else {
      defaultValues[name] = defaultValue;
    }
  });
}

function defineNode(opts) {
  if (!opts.category) {
    throw new Error('Node must have a category');
  }

  if (!opts.name) {
    throw new Error('Node must have a name');
  }

  const metadata = {
    inputs: {},
    outputs: {},
    category: opts.category,
    dynamicports: opts.dynamicports,
    exportDynamicPorts: opts.exportDynamicPorts,
    useVariants: opts.useVariants,
    allowChildren: opts.allowChildren,
    allowChildrenWithCategory: opts.allowChildrenWithCategory,
    singleton: opts.singleton,
    connectionPanel: opts.connectionPanel,
    allowAsChild: opts.allowAsChild,
    visualStates: opts.visualStates,
    panels: opts.panels,
    color: opts.color,
    usePortAsLabel: opts.usePortAsLabel,
    portLabelTruncationMode: opts.portLabelTruncationMode,
    name: opts.name,
    displayNodeName: opts.displayNodeName || opts.displayName,
    deprecated: opts.deprecated,
    haveComponentPorts: opts.haveComponentPorts,
    version: opts.version,
    module: opts.module,
    docs: opts.docs,
    allowAsExportRoot: opts.allowAsExportRoot,
    nodeDoubleClickAction: opts.nodeDoubleClickAction,
    searchTags: opts.searchTags
  };

  opts._internal = opts._internal || {};

  //prototypeExtensions - old API
  //methods - new API
  opts.prototypeExtensions = opts.methods || opts.prototypeExtensions || {};
  opts.inputs = opts.inputs || {};
  opts.outputs = opts.outputs || {};
  opts.initialize = opts.initialize || function () {};

  let inputs = {};

  registerInputs(inputs, metadata, opts.inputs);
  registerOutputsMetadata(metadata, opts.outputs);
  function NodeConstructor(context, id) {
    Node.call(this, context, id);
  }

  Object.keys(opts.prototypeExtensions).forEach(function (propName) {
    if (!opts.prototypeExtensions[propName].value) {
      opts.prototypeExtensions[propName] = {
        value: opts.prototypeExtensions[propName]
      };
    }
  });

  NodeConstructor.prototype = Object.create(Node.prototype, opts.prototypeExtensions);
  Object.defineProperty(NodeConstructor.prototype, 'name', {
    value: opts.name
  });

  if (opts.getInspectInfo) NodeConstructor.prototype.getInspectInfo = opts.getInspectInfo;
  if (opts.nodeScopeDidInitialize) NodeConstructor.prototype.nodeScopeDidInitialize = opts.nodeScopeDidInitialize;

  const nodeDefinition = function (context, id, nodeScope) {
    const node = new NodeConstructor(context, id);

    //create all inputs. Use the inputs object for setters that don't have state and can be shared
    node._inputs = Object.create(inputs);

    //all inputs that use the valueChangedToTrue have state and need to be instanced
    Object.keys(opts.inputs).forEach(function (name) {
      var input = opts.inputs[name];
      if (input.valueChangedToTrue) {
        node._inputs[name] = {
          set: EdgeTriggeredInput.createSetter({
            valueChangedToTrue: input.valueChangedToTrue
          })
        };
      }
    });

    Object.keys(opts.outputs).forEach(function (name) {
      var output = opts.outputs[name];
      if (output.type === 'signal') {
        node.registerOutput(name, {
          getter: function () {
            //signals are always emitted as a sequence of false, true, so this getter is never used
            return undefined;
          }
        });
      } else {
        node.registerOutput(name, output);
      }
    });

    opts.numberedInputs && registerNumberedInputs(node, opts.numberedInputs);

    node.nodeScope = nodeScope;
    initializeDefaultValues(node._inputValues, metadata.inputs);

    opts.initialize.call(node);

    return node;
  };

  nodeDefinition.metadata = metadata;

  if (opts.numberedInputs) registerSetupFunctionForNumberedInputs(nodeDefinition, opts.name, opts.numberedInputs);

  return nodeDefinition;
}

function registerSetupFunctionForNumberedInputs(nodeDefinition, nodeType, numberedInputs) {
  const inputNames = Object.keys(numberedInputs);

  if (!inputNames.length) return;

  nodeDefinition.setupNumberedInputDynamicPorts = function (context, graphModel) {
    const editorConnection = context.editorConnection;

    if (!editorConnection || !editorConnection.isRunningLocally()) {
      return;
    }

    function collectPorts(node, inputName, input) {
      const connections = node.component.getConnectionsTo(node.id).map((c) => c.targetPort);

      const allPortNames = Object.keys(node.parameters).concat(connections);
      const portNames = allPortNames.filter((p) => p.startsWith(inputName + ' '));

      //Figure out how many we need to create
      //It needs to be the highest index + 1
      //Only parameters with values are present, e.g. input 3 can be missing even if input 4 is defined
      const maxIndex = portNames.length
        ? 1 + Math.max(...portNames.map((p) => Number(p.slice(inputName.length + 1))))
        : 0;
      const numPorts = maxIndex + 1;

      const ports = [];

      for (let i = 0; i < numPorts; i++) {
        const port = {
          name: inputName + ' ' + i,
          displayName: (input.displayPrefix || inputName) + ' ' + i,
          type: input.type,
          plug: 'input',
          group: input.group
        };

        if (input.hasOwnProperty('index')) {
          port.index = input.index + i;
        }

        ports.push(port);
      }

      return ports;
    }

    function updatePorts(node) {
      const ports = inputNames.map((inputName) => collectPorts(node, inputName, numberedInputs[inputName])).flat();
      editorConnection.sendDynamicPorts(node.id, ports);
    }

    graphModel.on('nodeAdded.' + nodeType, (node) => {
      updatePorts(node);
      node.on('parameterUpdated', () => {
        updatePorts(node);
      });

      node.on('inputConnectionAdded', () => {
        updatePorts(node);
      });

      node.on('inputConnectionRemoved', () => {
        updatePorts(node);
      });
    });
  };
}

function extend(obj1, obj2) {
  for (var p in obj2) {
    if (p === 'initialize' && obj1.initialize) {
      var oldInit = obj1.initialize;
      obj1.initialize = function () {
        oldInit.call(this);
        obj2.initialize.call(this);
      };
    } else if (obj2[p] && obj2[p].constructor === Object) {
      obj1[p] = extend(obj1[p] || {}, obj2[p]);
    } else if (obj2[p] && obj2[p].constructor === Array && obj1[p] && obj1[p].constructor == Array) {
      obj1[p] = obj1[p].concat(obj2[p]);
    } else {
      obj1[p] = obj2[p];
    }
  }
  return obj1;
}

module.exports = {
  defineNode: defineNode,
  extend: extend
};
