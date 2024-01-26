'use strict';

const Model = require('./model');
const { getAbsoluteUrl } = require('./utils');

var userFunctionsCache = {};

function JavascriptNodeParser(code, options) {
  this.inputs = {};
  this.outputs = {};
  this.error = undefined;
  this.code = code;

  const node = options ? options.node : undefined;
  this._initializeAPIs();

  var userCode = userFunctionsCache[code];
  if (!userCode) {
    try {
      userCode = new Function(['define', 'script', 'Node', 'Component'], JavascriptNodeParser.getCodePrefix() + code);
      userFunctionsCache[code] = userCode;
    } catch (e) {
      this.error = e.message;
      console.error(e);
    }
  }
  if (userCode) {
    try {
      userCode(
        this.define.bind(this),
        this.script.bind(this),
        this.apis.Node,
        node ? JavascriptNodeParser.getComponentScopeForNode(node) : {}
      ); //noodlJavascriptAPI);

      this._afterSourced();
    } catch (e) {
      this.error = e.message;
      console.error(e);
    }
  }
}

// First generation API
JavascriptNodeParser.prototype.define = function (userObject) {
  this.inputs = userObject.inputs || {};
  this.outputs = userObject.outputs || {};
  this.setup = userObject.setup;
  this.change = userObject.run || userObject.change;
  this.destroy = userObject.destroy;

  this.definedObject = userObject;
};

// Second generation API
function _scriptExtend(_this) {
  var _extended = {
    inputs: _this.inputs || {},
    outputs: _this.outputs || {},

    setup: function (inputs, outputs) {
      this.inputs = inputs;
      this.outputs = outputs;

      this.setOutputs = function (states) {
        for (var key in states) {
          this.outputs[key] = states[key];
          this.flagOutputDirty(key);
        }
      };

      if (_this.methods) {
        for (var key in _this.methods) {
          this[key] = _this.methods[key];
        }
      }

      _this.setup && _this.setup.apply(this);
    },

    destroy: function (inputs, outputs) {
      this.inputs = inputs;
      this.outputs = outputs;

      _this.destroy && _this.destroy.apply(this);
    },

    change: function (inputs, outputs) {
      this.inputs = inputs;
      this.outputs = outputs;

      // Detect property changed
      var old = this._oldInputs || {};

      if (_this.changed) {
        for (var key in inputs) {
          if (inputs[key] !== old[key]) {
            var changedFunction = _this.changed[key];
            if (typeof changedFunction === 'function') changedFunction.apply(this, [inputs[key], old[key]]);
          }
        }
      }

      this._oldInputs = Object.assign({}, inputs);
    }
  };

  if (_this.signals) {
    for (var key in _this.signals) {
      _extended[key] = _this.signals[key];

      _extended.inputs[key] = 'signal';
    }
  }

  return _extended;
}

JavascriptNodeParser.prototype.script = function (userObject) {
  var _userObjectExtended = _scriptExtend(userObject);
  this.inputs = _userObjectExtended.inputs || {};
  this.outputs = _userObjectExtended.outputs || {};
  this.setup = _userObjectExtended.setup;
  this.change = _userObjectExtended.run || _userObjectExtended.change;
  this.destroy = _userObjectExtended.destroy;

  this.definedObject = _userObjectExtended;
};

// Third generation API

// Node.Setters.Hej = function(value) {...}
// Node.OnInputsChanged = function() {...}
// Node.Signals.Hej = function(value) {...}
// Node.OnInit = function() {...}
// Node.OnDestroy = function() {...}
// Node.Inputs.A
// Node.Outputs.A = 10;
// Node.Outputs.Done()
// Node.setOutputs({...})
// Component.Object, Component.ParentObject
JavascriptNodeParser.prototype._initializeAPIs = function () {
  this.apis = {};

  this.apis.Node = {
    Inputs: {},
    Outputs: {},
    Signals: {},
    Setters: {}
  };
};

JavascriptNodeParser.prototype._afterSourced = function () {
  if (this.definedObject !== undefined) return; // a legacy API have been used

  var _Node = this.apis.Node;

  // Merge inputs and outputs from node extension
  this.inputs = Object.assign({}, _Node.Inputs || {});
  this.outputs = Object.assign({}, _Node.Outputs || {});

  this.setup = function (inputs, outputs) {
    const _this = this;

    _Node.setOutputs = function (_outputs) {
      for (var key in _outputs) {
        outputs[key] = _outputs[key];
        _this.flagOutputDirty(key);
      }
    };

    _Node.OnInit && _Node.OnInit.apply(this);
  };

  this.destroy = _Node.OnDestroy || this.destory;
  this.change = (inputs, outputs, changedInputs) => {
    for (var key in changedInputs) {
      if (typeof _Node.Setters[key] === 'function') {
        _Node.Setters[key](inputs[key]);
      }
    }

    if (typeof _Node.OnInputsChanged === 'function') {
      _Node.OnInputsChanged();
    }
  };

  this.definedObject = {
    inputs: this.inputs,
    outputs: this.outputs,
    setup: this.setup,
    destroy: this.destroy,
    change: this.change
  };

  // Set all signals as signal inputs
  if (_Node.Signals !== undefined) {
    for (var key in _Node.Signals) {
      if (typeof _Node.Signals[key] === 'function') {
        this.inputs[key] = 'signal';

        this.definedObject[key] = _Node.Signals[key];
      }
    }
  }
};

JavascriptNodeParser.createFromCode = function (code, options) {
  return new JavascriptNodeParser(code, options);
};

JavascriptNodeParser.createFromURL = function (url, callback, options) {
  url = getAbsoluteUrl(url);

  var xhr = new window.XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function () {
    // XMLHttpRequest.DONE = 4, but torped runtime doesn't support enum
    if (this.readyState === 4 || this.readyState === XMLHttpRequest.DONE) {
      callback(new JavascriptNodeParser(this.response));
    }
  };
  xhr.onerror = function () {
    console.log('Failed to request', url);
  };
  xhr.send();
};

JavascriptNodeParser.parseAndAddPortsFromScript = function (script, ports, options) {
  // Extract inputs and outputs
  function _exists(port) {
    if (typeof port === 'string') return ports.find((p) => p.name === port) !== undefined;
    else return ports.find((p) => p.name === port.name && p.plug === port.plug) !== undefined;
  }

  function _addPortsFromMatch(match, options) {
    if (match === undefined || match === null) return;

    const unique = {};
    for (const _s of match) {
      let name = _s[1];
      if (name === undefined) continue;

      unique[name] = true;
    }

    Object.keys(unique).forEach((p) => {
      if (
        _exists({
          name: options.prefix + p,
          plug: options.plug
        })
      )
        return;

      ports.push({
        name: options.prefix + p,
        displayName: p,
        plug: options.plug,
        type: options.type,
        group: options.group
      });
    });
  }

  // const scriptWithoutComments = script.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,''); // Remove comments

  // Regular Inputs. notation
  if (!options.skipInputs) {
    _addPortsFromMatch(script.matchAll(/Inputs\.([A-Za-z0-9_]+)/g), {
      type: options.inputType || '*',
      plug: 'input',
      group: options.inputGroup || 'Inputs',
      prefix: options.inputPrefix || ''
    });

    // Inputs with Inputs["A"] notation
    _addPortsFromMatch(script.matchAll(/Inputs\s*\[\s*(?:'|")(.*)(?:'|")\s*\]/g), {
      type: options.inputType || '*',
      plug: 'inputs',
      group: options.inputGroup || 'Inputs',
      prefix: options.inputPrefix || ''
    });
  }

  if (!options.skipOutputs) {
    if (!options.skipOutputSignals) {
      // Output signals, Output.Done()
      _addPortsFromMatch(script.matchAll(/Outputs\.([A-Za-z0-9]+)\s*\(\s*\)/g), {
        type: 'signal',
        plug: 'output',
        group: 'Outputs',
        prefix: options.outputPrefix || ''
      });

      // Output signals, Outputs["Done"]()
      _addPortsFromMatch(script.matchAll(/Outputs\s*\[\s*(?:'|")(.*)(?:'|")\s*\]\(\s*\)/g), {
        type: 'signal',
        plug: 'output',
        group: 'Outputs',
        prefix: options.outputPrefix || ''
      });
    }

    if (!options.skipRegularOutputs) {
      // Regular output Outputs. notation
      _addPortsFromMatch(script.matchAll(/Outputs\.([A-Za-z0-9_]+)/g), {
        type: '*',
        plug: 'output',
        group: 'Outputs',
        prefix: options.outputPrefix || ''
      });

      // Outputs with Outputs["A"] notation
      _addPortsFromMatch(script.matchAll(/Outputs\s*\[\s*\"([^\"]*)\"\s*\]/g), {
        type: '*',
        plug: 'output',
        group: 'Outputs',
        prefix: options.outputPrefix || ''
      });
    }
  }
};

JavascriptNodeParser.prototype.getPorts = function () {
  var ports = [];

  var self = this;

  Object.keys(this.inputs).forEach(function (name) {
    var inputPort = self.inputs[name];

    var port = {
      name: name,
      plug: 'input'
    };
    if (typeof inputPort === 'string') {
      port.type = {
        name: inputPort
      };
      port.group = 'Inputs';
    } else {
      for (var p in inputPort) {
        port[p] = inputPort[p];
      }
    }

    ports.push(port);
  });

  Object.keys(this.outputs).forEach(function (name) {
    ports.push({
      name: name,
      type: {
        name: self.outputs[name]
      },
      plug: 'output',
      group: 'Outputs'
    });
  });

  JavascriptNodeParser.parseAndAddPortsFromScript(this.code, ports, {});

  return ports;
};

const _componentScopes = {};

function _findParentComponentStateModelId(node) {
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

      if (parent.nodeScope.getNodesWithType('Component State').length > 0) {
        return parent;
      }

      //if not, continue searching up the tree
      return getParentComponent(parent);
    }
  }

  const parent = getParentComponent(node.nodeScope.componentOwner);
  if (!parent) return;

  //this._internal.parentComponentName = parent.name;

  return 'componentState' + parent.getInstanceId();
}

function _findForEachModel(node) {
  var component = node.nodeScope.componentOwner;
  while (component !== undefined && component._forEachModel === undefined && component.parentNodeScope) {
    component = component.parentNodeScope.componentOwner;
  }
  return component !== undefined ? component._forEachModel : undefined;
}

JavascriptNodeParser.getComponentScopeForNode = function (node) {
  const componentId = node.nodeScope.componentOwner.getInstanceId();

  if (_componentScopes[componentId] === undefined) {
    _componentScopes[componentId] = {};

    const componentObject = (node.nodeScope.modelScope || Model).get('componentState' + componentId);

    _componentScopes[componentId].Object = componentObject;
  }

  // This should be done each time, since the component can be moved
  const parentComponentObjectId = _findParentComponentStateModelId(node);
  const parentComponentObject =
    parentComponentObjectId !== undefined
      ? (node.nodeScope.modelScope || Model).get(parentComponentObjectId)
      : undefined;

  _componentScopes[componentId].ParentObject = parentComponentObject;

  // Set the for each model
  _componentScopes[componentId].RepeaterObject = _findForEachModel(node);

  return _componentScopes[componentId];
};

JavascriptNodeParser.getCodePrefix = function () {
  // API
  return "const Script = (typeof Node !== 'undefined')?Node:undefined;\n";
};

JavascriptNodeParser.createNoodlAPI = function () {
  // If we are running in browser mode and there is a global Noodl API object, use it. If not
  // create a new one for this scope.
  return typeof window !== 'undefined' && window.Noodl !== undefined ? window.Noodl : {};
};

module.exports = JavascriptNodeParser;
