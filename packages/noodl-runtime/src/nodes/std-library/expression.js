'use strict';

const difference = require('lodash.difference');

//const Model = require('./data/model');

const ExpressionNode = {
  name: 'Expression',
  docs: 'https://docs.noodl.net/nodes/math/expression',
  usePortAsLabel: 'expression',
  category: 'CustomCode',
  color: 'javascript',
  nodeDoubleClickAction: {
    focusPort: 'Expression'
  },
  searchTags: ['javascript'],
  initialize: function () {
    var internal = this._internal;

    internal.scope = {};
    internal.hasScheduledEvaluation = false;

    internal.code = undefined;
    internal.cachedValue = 0;
    internal.currentExpression = '';
    internal.compiledFunction = undefined;
    internal.inputNames = [];
    internal.inputValues = [];
  },
  getInspectInfo() {
    return this._internal.cachedValue;
  },
  inputs: {
    expression: {
      group: 'General',
      inputPriority: 1,
      type: {
        name: 'string',
        allowEditOnly: true,
        codeeditor: 'javascript'
      },
      displayName: 'Expression',
      set: function (value) {
        var internal = this._internal;
        internal.currentExpression = functionPreamble + 'return (' + value + ');';
        internal.compiledFunction = undefined;

        var newInputs = parsePorts(value);

        var inputsToAdd = difference(newInputs, internal.inputNames);
        var inputsToRemove = difference(internal.inputNames, newInputs);

        var self = this;
        inputsToRemove.forEach(function (name) {
          self.deregisterInput(name);
          delete internal.scope[name];
        });

        inputsToAdd.forEach(function (name) {
          if (self.hasInput(name)) {
            return;
          }

          self.registerInput(name, {
            set: function (value) {
              internal.scope[name] = value;
              if (!this.isInputConnected('run')) this._scheduleEvaluateExpression();
            }
          });

          internal.scope[name] = 0;
          self._inputValues[name] = 0;
        });

        /*      if(value.indexOf('Vars') !== -1 || value.indexOf('Variables') !== -1)  {
                    // This expression is using variables, it should listen for changes
                    this._internal.onVariablesChangedCallback = (args) => {
                        this._scheduleEvaluateExpression()
                    }

                    Model.get('--ndl--global-variables').off('change',this._internal.onVariablesChangedCallback)
                    Model.get('--ndl--global-variables').on('change',this._internal.onVariablesChangedCallback)
                }*/

        internal.inputNames = Object.keys(internal.scope);
        if (!this.isInputConnected('run')) this._scheduleEvaluateExpression();
      }
    },
    run: {
      group: 'Actions',
      displayName: 'Run',
      type: 'signal',
      valueChangedToTrue: function () {
        this._scheduleEvaluateExpression();
      }
    }
  },
  outputs: {
    result: {
      group: 'Result',
      type: '*',
      displayName: 'Result',
      getter: function () {
        if (!this._internal.currentExpression) {
          return 0;
        }

        return this._internal.cachedValue;
      }
    },
    isTrue: {
      group: 'Result',
      type: 'boolean',
      displayName: 'Is True',
      getter: function () {
        if (!this._internal.currentExpression) {
          return false;
        }

        return !!this._internal.cachedValue;
      }
    },
    isFalse: {
      group: 'Result',
      type: 'boolean',
      displayName: 'Is False',
      getter: function () {
        if (!this._internal.currentExpression) {
          return true;
        }

        return !this._internal.cachedValue;
      }
    },
    isTrueEv: {
      group: 'Events',
      type: 'signal',
      displayName: 'On True'
    },
    isFalseEv: {
      group: 'Events',
      type: 'signal',
      displayName: 'On False'
    }
  },
  prototypeExtensions: {
    registerInputIfNeeded: {
      value: function (name) {
        if (this.hasInput(name)) {
          return;
        }

        this._internal.scope[name] = 0;
        this._inputValues[name] = 0;

        this.registerInput(name, {
          set: function (value) {
            this._internal.scope[name] = value;
            if (!this.isInputConnected('run')) this._scheduleEvaluateExpression();
          }
        });
      }
    },
    _scheduleEvaluateExpression: {
      value: function () {
        var internal = this._internal;
        if (internal.hasScheduledEvaluation === false) {
          internal.hasScheduledEvaluation = true;
          this.flagDirty();
          this.scheduleAfterInputsHaveUpdated(function () {
            var lastValue = internal.cachedValue;
            internal.cachedValue = this._calculateExpression();
            if (lastValue !== internal.cachedValue) {
              this.flagOutputDirty('result');
              this.flagOutputDirty('isTrue');
              this.flagOutputDirty('isFalse');
            }
            if (internal.cachedValue) this.sendSignalOnOutput('isTrueEv');
            else this.sendSignalOnOutput('isFalseEv');
            internal.hasScheduledEvaluation = false;
          });
        }
      }
    },
    _calculateExpression: {
      value: function () {
        var internal = this._internal;

        if (!internal.compiledFunction) {
          internal.compiledFunction = this._compileFunction();
        }
        for (var i = 0; i < internal.inputNames.length; ++i) {
          var inputValue = internal.scope[internal.inputNames[i]];
          internal.inputValues[i] = inputValue;
        }
        try {
          return internal.compiledFunction.apply(null, internal.inputValues);
        } catch (e) {
          console.error('Error in expression:', e.message);
        }
        return 0;
      }
    },
    _compileFunction: {
      value: function () {
        var expression = this._internal.currentExpression;
        var args = Object.keys(this._internal.scope);

        var key = expression + args.join(' ');

        if (compiledFunctionsCache.hasOwnProperty(key) === false) {
          args.push(expression);

          try {
            compiledFunctionsCache[key] = construct(Function, args);
          } catch (e) {
            console.error('Failed to compile JS function', e.message);
          }
        }
        return compiledFunctionsCache[key];
      }
    }
  }
};

var functionPreamble = [
  'var min = Math.min,' +
    '    max = Math.max,' +
    '    cos = Math.cos,' +
    '    sin = Math.sin,' +
    '    tan = Math.tan,' +
    '    sqrt = Math.sqrt,' +
    '    pi = Math.PI,' +
    '    round = Math.round,' +
    '    floor = Math.floor,' +
    '    ceil = Math.ceil,' +
    '    abs = Math.abs,' +
    '    random = Math.random;'
  /* '    Vars = Variables = Noodl.Object.get("--ndl--global-variables");' */
].join('');

//Since apply cannot be used on constructors (i.e. new Something) we need this hax
//see http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
function construct(constructor, args) {
  function F() {
    return constructor.apply(this, args);
  }
  F.prototype = constructor.prototype;
  return new F();
}

var compiledFunctionsCache = {};

var portsToIgnore = [
  'min',
  'max',
  'cos',
  'sin',
  'tan',
  'sqrt',
  'pi',
  'round',
  'floor',
  'ceil',
  'abs',
  'random',
  'Math',
  'window',
  'document',
  'undefined',
  'Vars',
  'true',
  'false',
  'null',
  'Boolean'
];

function parsePorts(expression) {
  var ports = [];

  function addPort(name) {
    if (portsToIgnore.indexOf(name) !== -1) return;
    if (
      ports.some(function (p) {
        return p === name;
      })
    )
      return;

    ports.push(name);
  }

  // First remove all strings
  expression = expression.replace(/\"([^\"]*)\"/g, '').replace(/\'([^\']*)\'/g, '');

  // Extract identifiers
  var identifiers = expression.matchAll(/[a-zA-Z\_\$][a-zA-Z0-9\.\_\$]*/g);
  for (const _id of identifiers) {
    var name = _id[0];
    if (name.indexOf('.') !== -1) {
      name = name.split('.')[0]; // Take first symbol on "." sequence
    }

    addPort(name);
  }

  return ports;
}

function updatePorts(nodeId, expression, editorConnection) {
  var portNames = parsePorts(expression);

  var ports = portNames.map(function (name) {
    return {
      group: 'Parameters',
      name: name,
      type: {
        name: '*',
        editAsType: 'string'
      },
      plug: 'input'
    };
  });

  editorConnection.sendDynamicPorts(nodeId, ports);
}

function evalCompileWarnings(editorConnection, node) {
  try {
    new Function(node.parameters.expression);
    editorConnection.clearWarning(node.component.name, node.id, 'expression-compile-error');
  } catch (e) {
    editorConnection.sendWarning(node.component.name, node.id, 'expression-compile-error', {
      message: e.message
    });
  }
}

module.exports = {
  node: ExpressionNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    graphModel.on('nodeAdded.Expression', function (node) {
      if (node.parameters.expression) {
        updatePorts(node.id, node.parameters.expression, context.editorConnection);
        evalCompileWarnings(context.editorConnection, node);
      }
      node.on('parameterUpdated', function (event) {
        if (event.name === 'expression') {
          updatePorts(node.id, node.parameters.expression, context.editorConnection);
          evalCompileWarnings(context.editorConnection, node);
        }
      });
    });
  }
};
