'use strict';

const Node = require('@noodl/runtime').Node;
const JavascriptNodeParser = require('@noodl/runtime/src/javascriptnodeparser');
const { logJavaScriptNodeError } = require('@noodl/runtime/src/utils');
const guid = require('../../guid');

/*const defaultCode = "define({\n"+
"\t// The input ports of the Javascript node, name of input and type\n"+
"\tinputs:{\n"+
"\t    // ExampleInput:'number',\n"+
"\t    // Available types are 'number', 'string', 'boolean', 'color' and 'signal',\n"+
"\t    mySignal:'signal',\n"+
"\t},\n"+
"\t\n"+
"\t// The output ports of the Javascript node, name of output and type\n"+
"\toutputs:{\n"+
"\t    // ExampleOutput:'string',\n"+
"\t},\n"+
"\t\n"+
"\t// All signal inputs need their own function with the corresponding name that\n"+
"\t// will be run when a signal is received on the input.\n"+
"\tmySignal:function(inputs,outputs) {\n"+
"\t\t// ...\n"+
"\t},\n"+
"\t\n"+
"\t// This function will be called when any of the inputs have changed\n"+
"\tchange:function(inputs,outputs) {\n"+
"\t\t// ...\n"+
"\t}\n"+
"})\n";*/

/*
const defaultCode = "script({\n"+
"\t// The input ports of the Javascript node, name of input and type\n"+
"\tinputs:{\n"+
"\t    // ExampleInput:'number',\n"+
"\t    // Available types are 'number', 'string', 'boolean', 'color'\n"+
"\t    //myNumber:'number',\n"+
"\t},\n"+
"\t\n"+
"\t// The output ports of the Javascript node, name of output and type\n"+
"\toutputs:{\n"+
"\t    // ExampleOutput:'string',\n"+
"\t},\n"+
"\t\n"+
"\t// Declare signal handle functions here, each function will be \n"+
"\t// exposed as a signal input to this node.\n"+
"\tsignals:{\n"+
"\t\t// mySignal:function() {   }\n"+
"\t},\n"+
"\t\n"+
"\t// These functions will be called when the correspinding input\n"+
"\t// is changed and the new value is provided\n"+
"\tchanged:{\n"+
"\t\t// myNumber:function(value) { }\n"+
"\t},\n"+
"\t\n"+
"\t// Here you can declare any function that will then be available\n"+
"\t// in this. So you can acces the function below with this.aFunction()\n"+
"\tmethods:{\n"+
"\t\t// aFunction:function(value) { }\n"+
"\t}\n"+
"})\n";
*/

const defaultCode = '';

var Javascript = {
  name: 'Javascript2',
  docs: 'https://docs.noodl.net/nodes/javascript/script',
  displayNodeName: 'Script',
  category: 'CustomCode',
  color: 'javascript',
  nodeDoubleClickAction: {
    focusPort: 'Code'
  },
  searchTags: ['javascript'],
  exportDynamicPorts: true,
  initialize: function () {
    var internal = this._internal;
    internal.inputValues = {};
    internal.outputValues = {};
    internal.outputProperties = {};
    internal.runScheduled = false;
    internal.setupScheduled = false;
    internal.runNextFrameScheduled = false;
    internal.isWaitingForExternalFileToLoad = false;
    internal.useExternalFile = false;
    internal.runFunction = undefined;
    internal.destroyFunction = undefined;
    internal.setupFunction = undefined;
    internal.hasParsedCode = false;
    internal.changedInputs = {};
    internal.signalScheduled = {};
    internal.killed = false;
    internal.inputQueue = [];

    var self = this;
    internal.userFunctionScope = {
      createComponent(componentName) {
        if (componentName && componentName.length > 0 && componentName[0] !== '/') {
          componentName = '/' + componentName;
        }

        return self.nodeScope.createNode(componentName, guid());
      },
      deleteComponent(component) {
        self.nodeScope.deleteNode(component);
      },
      flagOutputDirty: function (name) {
        if (!name) {
          throw new Error('Output port name must be specified');
        }
        self.flagOutputDirty(name);
      },
      runNextFrame: function () {
        if (internal.runNextFrameScheduled) {
          return;
        }
        internal.runNextFrameScheduled = true;
        self.context.scheduleNextFrame(function () {
          internal.runNextFrameScheduled = false;

          if (!internal.killed) {
            scheduleRun.call(self);
          }
        });
      },
      sendSignalOnOutput: function (name) {
        self.sendSignalOnOutput(name);
      }
    };

    internal.onFrameStart = onFrameStart.bind(this);
  },
  dynamicports: [
    {
      condition: 'useExternalFile = no OR useExternalFile NOT SET',
      inputs: ['code']
    },
    {
      condition: 'useExternalFile = yes',
      inputs: ['externalFile']
    }
  ],
  inputs: {
    scriptInputs: {
      type: {
        name: 'proplist',
        allowEditOnly: true
      },
      group: 'Script Inputs',
      set: function (value) {
        //  ignore
      }
    },
    scriptOutputs: {
      type: {
        name: 'proplist',
        allowEditOnly: true
      },
      group: 'Script Outputs',
      set: function (value) {
        //  ignore
      }
    },
    useExternalFile: {
      type: {
        name: 'enum',
        enums: [
          {
            value: 'yes',
            label: 'Yes'
          },
          {
            value: 'no',
            label: 'No'
          }
        ],
        allowEditOnly: true
      },
      default: 'no',
      displayName: 'Use External File',
      group: 'Code',
      set: function (value) {
        this._internal.isWaitingForExternalFileToLoad = value === 'yes';
        this._internal.useExternalFile = value === 'yes';
      }
    },
    code: {
      displayName: 'Code',
      group: 'Code',
      type: {
        name: 'string',
        allowEditOnly: true,
        codeeditor: 'javascript'
      },
      default: defaultCode,
      set: function (value) {
        if (!value) {
          return;
        }
        var self = this;
        this.scheduleAfterInputsHaveUpdated(function () {
          if (this._internal.useExternalFile === false) {
            this._callDestroyFunction();
            var parser = JavascriptNodeParser.createFromCode(value, {
              node: this
            });
            self._onCodeParsed(parser);
          }
        });
      }
    },
    externalFile: {
      displayName: 'File Path',
      group: 'Code',
      type: {
        name: 'source',
        allowEditOnly: true
      },
      set: function (url) {
        if (this._internal.useExternalFile === false) {
          return;
        }

        var self = this;
        JavascriptNodeParser.createFromURL(
          url,
          function (parser) {
            self._internal.isWaitingForExternalFileToLoad = false;
            self._onCodeParsed(parser);
          },
          {
            node: this
          }
        );
      }
    }
  },
  prototypeExtensions: {
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
      this._internal.killed = true;
      this._callDestroyFunction();
    },
    update: function () {
      if (this._internal.isWaitingForExternalFileToLoad === true) {
        this._dirty = false;
      } else {
        Node.prototype.update.call(this);
      }
    },
    _onCodeParsed: function (parser) {
      const editorConnection = this.context.editorConnection;

      if (editorConnection) {
        for (const w of ['js-destroy-waring', 'js-run-waring', 'js-setup-waring']) {
          editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, w);
        }
      }

      if (parser.error) {
        return;
      }

      //register all color inputs with type 'color' to enable color resolving
      Object.keys(this.model.inputPorts).forEach((name) => {
        const type = this.model.inputPorts[name].type;
        if (type === 'color' || type.name === 'color') {
          this._internal.inputValues[name] = undefined;

          if (!this.hasInput(name)) {
            this.registerInput(name, {
              type: 'color',
              set: userInputSetter.bind(this, name)
            });
          } else {
            //input was registered before js was done parsing
            //patch it instead of creating a new one
            this.getInput(name).type = 'color';
          }
        }
      });

      Object.keys(this.model.outputPorts).forEach((name) => {
        this.registerOutputIfNeeded(name);
      });

      this._internal.setupFunction = parser.setup;
      this._internal.runFunction = parser.change; // Run function is actually called change
      this._internal.destroyFunction = parser.destroy;

      this._internal.definedObject = parser.definedObject;

      if (this._internal.setupFunction) {
        scheduleSetup.call(this);
      }

      if (this._internal.runFunction) {
        scheduleRun.call(this);
      }

      this._internal.hasParsedCode = true;

      //set all the inputs that arrived before the code was parsed
      if (this._internal.inputQueue) {
        for (const { name, value } of this._internal.inputQueue) {
          this.setInputValue(name, value);
        }

        //delete the queue, not needed anymore
        this._internal.inputQueue = undefined;
      }

      // Node API
      parser.apis.Node.Inputs = this._internal.inputValues;
      parser.apis.Node.Outputs = this._internal.outputProperties;
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      this._internal.inputValues[name] = undefined;

      this.registerInput(name, {
        set: userInputSetter.bind(this, name)
      });
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      var self = this;

      const isSignal = _typename(this.model.outputPorts[name].type) === 'signal';

      Object.defineProperty(this._internal.outputProperties, name, {
        set: function (value) {
          if (isSignal) return; // Cannot set signal functions

          self._internal.outputValues[name] = value;
          self.flagOutputDirty(name);
        },
        get: function () {
          if (isSignal)
            return () => {
              if (self.hasOutput(name)) self.sendSignalOnOutput(name);
            };
          return self._internal.outputValues[name];
        }
      });

      this.registerOutput(name, {
        getter: userOutputGetter.bind(this, name)
      });
    },
    _callRunFunction: function () {
      var internal = this._internal;
      if (!internal.runFunction || internal.killed) {
        return;
      }

      try {
        internal.runFunction.call(
          internal.userFunctionScope,
          internal.inputValues,
          internal.outputProperties,
          internal.changedInputs
        );
      } catch (e) {
        logJavaScriptNodeError(e);

        if (this.context.editorConnection && this.context.isWarningTypeEnabled('javascriptExecution')) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'js-run-waring', {
            showGlobally: true,
            message: '<strong>run</strong>: ' + e.message
          });
        }
      }
    },
    _callSignalFunction: function (name) {
      var internal = this._internal;
      if (!internal.definedObject || internal.killed) {
        return;
      }

      if (!internal.definedObject[name] || typeof internal.definedObject[name] !== 'function') {
        return;
      }

      try {
        internal.definedObject[name].call(internal.userFunctionScope, internal.inputValues, internal.outputProperties);
      } catch (e) {
        console.log(
          'Error in JS node signal function code.',
          Object.getPrototypeOf(e).constructor.name + ': ' + e.message
        );
        if (this.context.editorConnection && this.context.isWarningTypeEnabled('javascriptExecution')) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'js-run-waring', {
            showGlobally: true,
            message: '<strong>run</strong>: ' + e.message
          });
        }
      }
    },
    _callDestroyFunction: function () {
      var internal = this._internal;

      if (!internal.destroyFunction) {
        return;
      }

      try {
        internal.destroyFunction.call(internal.userFunctionScope, internal.inputValues, internal.outputProperties);
      } catch (e) {
        console.log('Error in JS node destroy code.', Object.getPrototypeOf(e).constructor.name + ': ' + e.message);
        if (this.context.editorConnection && this.context.isWarningTypeEnabled('javascriptExecution')) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'js-destroy-waring', {
            showGlobally: true,
            message: '<strong>setup</strong>: ' + e.message
          });
        }
      }
    },
    _callSetupFunction: function () {
      var internal = this._internal;
      if (!internal.setupFunction || internal.killed) {
        return;
      }

      try {
        internal.setupFunction.call(internal.userFunctionScope, internal.inputValues, internal.outputProperties);
      } catch (e) {
        console.log('Error in JS node setup code.', Object.getPrototypeOf(e).constructor.name + ': ' + e.message);
        if (this.context.editorConnection && this.context.isWarningTypeEnabled('javascriptExecution')) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'js-setup-waring', {
            showGlobally: true,
            message: '<strong>setup</strong>: ' + e.message
          });
        }
      }
    }
  }
};

function scheduleSetup() {
  /* jshint validthis:true */
  if (this._internal.setupScheduled) {
    return;
  }

  this._internal.setupScheduled = true;
  this.scheduleAfterInputsHaveUpdated(function () {
    if (!this._internal.killed) {
      this._callSetupFunction();
      this._internal.setupScheduled = false;
    }
  });
}

function scheduleRun() {
  /* jshint validthis:true */
  if (this._internal.runScheduled || this._internal.killed) {
    return;
  }

  this._internal.runScheduled = true;
  this.scheduleAfterInputsHaveUpdated(function () {
    if (!this._internal.killed) {
      this._callRunFunction();
      this._internal.changedInputs = {};
      this._internal.runScheduled = false;
    }
  });
}

function scheduleSignal(name) {
  /* jshint validthis:true */
  if (this._internal.signalScheduled[name] || this._internal.killed) {
    return;
  }

  this._internal.signalScheduled[name] = true;
  this.scheduleAfterInputsHaveUpdated(function () {
    if (!this._internal.killed) {
      this._callSignalFunction(name);
      this._internal.signalScheduled[name] = false;
    }
  });
}

function onFrameStart() {
  /* jshint validthis:true */
  this._internal.runNextFrame = false;
  scheduleRun.call(this);
}

function _typename(type) {
  if (typeof type === 'string') return type;
  else return type.name;
}

function userInputSetter(name, value) {
  /* jshint validthis:true */

  if (this._internal.hasParsedCode === true) {
    if (this.model.inputPorts[name] !== undefined && _typename(this.model.inputPorts[name].type) === 'signal') {
      // If this is a signal, call the signal function
      if (this._internal.definedObject && typeof this._internal.definedObject[name] === 'function') {
        // This is a signal input, schedule a call to the signal function
        if (value) scheduleSignal.call(this, name);
      }
    } else {
      this._internal.inputValues[name] = value;
      this._internal.changedInputs[name] = true;
      scheduleRun.call(this);
    }
  } else {
    //inputs are arriving before the code is parsed
    //queue them up and set them later to make sure signals are
    //properly recognized
    this._internal.inputQueue.push({
      name,
      value
    });
  }
}

function userOutputGetter(name) {
  /* jshint validthis:true */
  return this._internal.outputValues[name];
}

function _parseAndSourceJavascript(nodeModel, context, fn) {
  var editorConnection = context.editorConnection;

  if (!nodeModel.parameters) {
    return;
  }

  function clearWarnings() {
    for (const w of ['js-parse-waring', 'js-destroy-waring', 'js-run-waring', 'js-setup-waring']) {
      editorConnection.clearWarning(nodeModel.component.name, nodeModel.id, w);
    }
  }

  function onCodeParsed(parser) {
    if (parser.error) {
      editorConnection.sendWarning(nodeModel.component.name, nodeModel.id, 'js-parse-waring', {
        showGlobally: true,
        message: parser.error
      });
    } else {
      clearWarnings();
    }

    fn(parser.getPorts());
  }

  if (nodeModel.parameters.externalFile && nodeModel.parameters.useExternalFile === 'yes') {
    var url = nodeModel.parameters.externalFile;
    JavascriptNodeParser.createFromURL(url, onCodeParsed);
  } else if (nodeModel.parameters.code) {
    var parser = JavascriptNodeParser.createFromCode(nodeModel.parameters.code);
    onCodeParsed(parser);
  } else {
    //no code, just send empty port list
    clearWarnings();
    fn([]);
  }
}
module.exports = {
  node: Javascript,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      function _updatePorts() {
        var ports = [];

        const _inputTypeEnums = [
          {
            value: 'string',
            label: 'String'
          },
          {
            value: 'boolean',
            label: 'Boolean'
          },
          {
            value: 'number',
            label: 'Number'
          },
          {
            value: 'object',
            label: 'Object'
          },
          {
            value: 'array',
            label: 'Array'
          }
        ];

        const _outputTypeEnums = [
          {
            value: 'string',
            label: 'String'
          },
          {
            value: 'boolean',
            label: 'Boolean'
          },
          {
            value: 'number',
            label: 'Number'
          },
          {
            value: 'object',
            label: 'Object'
          },
          {
            value: 'array',
            label: 'Array'
          },
          {
            value: 'signal',
            label: 'Signal'
          }
        ];

        // Outputs
        if (node.parameters['scriptOutputs'] !== undefined && node.parameters['scriptOutputs'].length > 0) {
          node.parameters['scriptOutputs'].forEach((p) => {
            // Type for output
            ports.push({
              name: 'outtype-' + p.label,
              displayName: 'Type',
              plug: 'input',
              type: {
                name: 'enum',
                enums: _outputTypeEnums,
                allowEditOnly: true
              },
              default: 'string',
              parent: 'scriptOutputs',
              parentItemId: p.id
            });

            // Value for output
            ports.push({
              name: p.label,
              plug: 'output',
              type: node.parameters['outtype-' + p.label] || '*',
              group: 'Outputs'
            });
          });
        }

        // Inputs
        if (node.parameters['scriptInputs'] !== undefined && node.parameters['scriptInputs'].length > 0) {
          node.parameters['scriptInputs'].forEach((p) => {
            // Type for input
            ports.push({
              name: 'intype-' + p.label,
              displayName: 'Type',
              plug: 'input',
              type: {
                name: 'enum',
                enums: _inputTypeEnums,
                allowEditOnly: true
              },
              default: 'string',
              parent: 'scriptInputs',
              parentItemId: p.id
            });

            // Default Value for input
            ports.push({
              name: p.label,
              plug: 'input',
              type: node.parameters['intype-' + p.label] || 'string',
              group: 'Inputs'
            });
          });
        }

        _parseAndSourceJavascript(node, context, function (_ports) {
          // Merge in ports from script
          _ports.forEach((p) => {
            if (ports.find((_p) => _p.name === p.name && _p.plug === p.plug)) return; // Port already exists

            ports.push(p);
          });

          context.editorConnection.sendDynamicPorts(node.id, ports);
        });
      }

      _updatePorts();
      node.on('parameterUpdated', function (ev) {
        _updatePorts();
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.Javascript2', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('Javascript2')) {
        _managePortsForNode(node);
      }
    });
  }
};
