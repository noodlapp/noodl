const NoodlRuntime = require('@noodl/runtime');
const CloudStore = require('@noodl/runtime/src/api/cloudstore');

('use strict');

/*var defaultBeforeCallScript = "// Add custom code to setup the parameters send to the function\n"+
"// The parameters are found in the object called 'Parameters'\n";

var defaultAfterCallScript = "// Add custom code modfiy the result from the cloud function\n"+
"// The result is found in the object called 'Result'\n";*/

function _makeRequest(path, options) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      var json;
      try {
        json = JSON.parse(xhr.response);
      } catch (e) {}

      if (xhr.status === 200 || xhr.status === 201) {
        options.success(json);
      } else options.error(json);
    }
  };

  xhr.open(options.method || 'GET', options.endpoint + path, true);

  xhr.setRequestHeader('X-Parse-Application-Id', options.appId);
  xhr.setRequestHeader('Content-Type', 'application/json');

  // Check for current users
  var _cu = localStorage['Parse/' + options.appId + '/currentUser'];
  if (_cu !== undefined) {
    try {
      const currentUser = JSON.parse(_cu);
      xhr.setRequestHeader('X-Parse-Session-Token', currentUser.sessionToken);
    } catch (e) {
      // Failed to extract session token
    }
  }

  xhr.send(JSON.stringify(options.content));
}

var CloudFunctionNode = {
  name: 'Cloud Function',
  category: 'Cloud Services',
  color: 'data',
  usePortAsLabel: 'functionName',
  docs: 'https://docs.noodl.net/nodes/data/cloud-data/cloud-function',
  deprecated: true,
  initialize: function () {
    this._internal.paramsValues = {};
    // this._internal.resultsValues = {};
    // this._internal.convertArraysAndObjects = true;
  },
  getInspectInfo() {
    const result = this._internal.lastCallResult;
    if (!result) return '[Not executed yet]';

    return [{ type: 'value', value: result }];
  },
  inputs: {
    functionName: {
      type: 'string',
      displayName: 'Function Name',
      group: 'General',
      set: function (value) {
        this._internal.functionName = value;
      }
    },
    params: {
      group: 'Parameters',
      type: { name: 'stringlist', allowEditOnly: true },
      set: function (value) {
        this._internal.params = value;
      }
    },
    /* results:{
        group:'Result',
        type:{name:'stringlist',allowEditOnly:true},
        set:function(value) {
            this._internal.results = value;
        }
    },    
    beforeCallScript: {
        group:'Scripts',
        displayName:'Before Call',
        default:defaultBeforeCallScript,
        type:{name:'string',codeeditor:'javascript'},
        set: function(scriptCode) {
            try {
                if(scriptCode !== undefined) {
                    var args = ['Parameters'].concat([scriptCode]);
                    this._internal.scriptBeforeCallFunc = Function.apply(null,args);
                }
            }
            catch(e) {
                this._internal.scriptBeforeCallFunc = undefined;
                console.log('Error while parsing script (before call): ' +  e);
            }  
        }
    },
    afterCallScript: {
        group:'Scripts',
        displayName:'After Call',
        default:defaultAfterCallScript,
        type:{name:'string',codeeditor:'javascript'},
        set: function(scriptCode) {
            try {
                if(scriptCode !== undefined) {
                    var args = ['Result'].concat([scriptCode]);
                    this._internal.scriptAfterCallFunc = Function.apply(null,args);
                }
            }
            catch(e) {
                this._internal.scriptAfterCallFunc = undefined;
                console.log('Error while parsing script (after call): ' +  e);
            }  
        }
    },*/
    call: {
      type: 'signal',
      displayName: 'Call',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleCall();
      }
    }
    /* convertArraysAndObjects:{
        group:'Advanced',
        displayName:'Convert Objects',
        type:'boolean',
        default:true,
        set: function(value) {
            this._internal.convertArraysAndObjects = value;
        } 
    }*/
  },
  outputs: {
    success: {
      type: 'signal',
      displayName: 'Success',
      group: 'Signals'
    },
    failure: {
      type: 'signal',
      displayName: 'Failure',
      group: 'Signals'
    },
    result: {
      type: '*',
      displayName: 'Result',
      group: 'Output',
      getter: function () {
        return this._internal.result;
      }
    }
  },
  methods: {
    /* getResultsValue:function(name) {
        return this._internal.resultsValues[name];
    },*/
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      /*  if(name.startsWith('res-')) this.registerOutput(name, {
          getter: this.getResultsValue.bind(this, name.substring('res-'.length))
      });*/
    },
    setParamsValue: function (name, value) {
      this._internal.paramsValues[name] = value;
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('pm-'))
        this.registerInput(name, {
          set: this.setParamsValue.bind(this, name.substring('pm-'.length))
        });
    },
    scheduleCall: function () {
      var internal = this._internal;
      if (!internal.hasScheduledCall) {
        internal.hasScheduledCall = true;
        this.scheduleAfterInputsHaveUpdated(this.doCall.bind(this));
      }
    },
    doCall: function () {
      this._internal.hasScheduledCall = false;

      const cloudServices = NoodlRuntime.instance.getMetaData('cloudservices');
      if (cloudServices === undefined) {
        console.log('No cloud services defined in this project.');
        this._internal.lastCallResult = {
          status: 'failure',
          res: 'No active cloud services in this project'
        };

        this.sendSignalOnOutput('failure');
        return;
      }

      var appId = cloudServices.appId;
      var endpoint = cloudServices.endpoint;
      // Run before call script
      /*  if(this._internal.scriptBeforeCallFunc !== undefined) {
            this._internal.scriptBeforeCallFunc(this._internal.paramsValues);
        }*/

      _makeRequest('/functions/' + encodeURIComponent(this._internal.functionName), {
        appId,
        endpoint,
        content: this._internal.paramsValues,
        method: 'POST',
        success: (res) => {
          var res = res.result; // Cloud functions always return "result"
          if (res === undefined) {
            this.sendSignalOnOutput('failure');
            return;
          }

          // Run after call script
          /* if(this._internal.scriptAfterCallFunc !== undefined) {
                    this._internal.scriptAfterCallFunc(res);
                }*/

          this._internal.result = CloudStore._deserializeJSON(res);
          this.flagOutputDirty('result');

          this._internal.lastCallResult = {
            status: 'success',
            result: this._internal.result
          };

          // Deserialize values into Noodl arrays and objects
          /*  if(this._internal.convertArraysAndObjects) {
                    for(var key in res) {
                        if(res[key] !== undefined)
                            res[key] = CloudStore._fromJSON(res[key]);
                    }
                }*/

          /*this._internal.resultsValues = res;

                for(var key in res) {
                    if(this.hasOutput('res-'+key)) {
                        this.flagOutputDirty('res-'+key);
                    }
                }*/

          this.sendSignalOnOutput('success');
        },
        error: (res) => {
          this._internal.lastCallResult = {
            status: 'failure',
            res
          };

          this.sendSignalOnOutput('failure');
        }
      });
    }
  }
};

module.exports = {
  node: CloudFunctionNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      function _updatePorts() {
        var ports = [];

        // Add results outputs
        /*    var results = node.parameters.results;
                if (results !== undefined) {
                    results = results.split(',');
                    for (var i in results) {
                        var p = results[i];

                        ports.push({
                            type: {
                                name: '*',
                            },
                            plug: 'output',
                            group: 'Results',
                            name: 'res-' + p,
                            displayName: p
                        });

                    }
                }*/

        // Add params inputs
        var params = node.parameters.params;
        if (params !== undefined) {
          params = params.split(',');
          for (var i in params) {
            var p = params[i];

            ports.push({
              type: '*',
              plug: 'input',
              group: 'Parameters',
              name: 'pm-' + p,
              displayName: p
            });
          }
        }

        context.editorConnection.sendDynamicPorts(node.id, ports);
      }

      _updatePorts();
      node.on('parameterUpdated', function (event) {
        if (event.name === 'params') {
          _updatePorts();
        }
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.Cloud Function', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('Cloud Function')) {
        _managePortsForNode(node);
      }
    });
  }
};
