var defaultRequestScript =
  '' +
  '//Add custom code to setup the request object before the request\n' +
  '//is made.\n' +
  '//\n' +
  '//*Request.resource     contains the resource path of the request.\n' +
  '//*Request.method       contains the method, GET, POST, PUT or DELETE.\n' +
  '//*Request.headers      is a map where you can add additional headers.\n' +
  '//*Request.parameters   is a map the parameters that will be appended\n' +
  '//                      to the url.\n' +
  '//*Request.content      contains the content of the request as a javascript\n' +
  '//                      object.\n' +
  '//\n';
('//*Inputs and *Outputs contain the inputs and outputs of the node.\n');

var defaultResponseScript =
  '' +
  '// Add custom code to convert the response content to outputs\n' +
  '//\n' +
  '//*Response.status    The status code of the response\n' +
  '//*Response.content   The content of the response as a javascript\n' +
  '//                    object.\n' +
  '//*Response.request   The request object that resulted in the response.\n' +
  '//\n' +
  '//*Inputs and *Outputs contain the inputs and outputs of the node.\n';

var RestNode = {
  name: 'REST2',
  displayNodeName: 'REST',
  docs: 'https://docs.noodl.net/nodes/data/rest',
  category: 'Data',
  color: 'data',
  searchTags: ['http', 'request', 'fetch'],
  initialize: function () {
    this._internal.inputValues = {};
    this._internal.outputValues = {};

    this._internal.outputValuesProxy = new Proxy(this._internal.outputValues, {
      set: (obj, prop, value) => {
        //only send outputs when they change.
        //Some Noodl projects rely on this behavior, so changing it breaks backwards compability
        if (value !== this._internal.outputValues[prop]) {
          this.registerOutputIfNeeded('out-' + prop);

          this._internal.outputValues[prop] = value;
          this.flagOutputDirty('out-' + prop);
        }
        return true;
      }
    });

    this._internal.self = {};
  },
  getInspectInfo() {
    return this._internal.inspectData
      ? { type: 'value', value: this._internal.inspectData }
      : { type: 'text', value: '[Not executed yet]' };
  },
  inputs: {
    resource: {
      type: 'string',
      displayName: 'Resource',
      group: 'Request',
      default: '/',
      set: function (value) {
        this._internal.resource = value;
      }
    },
    method: {
      type: {
        name: 'enum',
        enums: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      },
      displayName: 'Method',
      group: 'Request',
      default: 'GET',
      set: function (value) {
        this._internal.method = value;
      }
    },
    /*  scriptInputs: {
      type: { name: 'proplist', allowEditOnly: true },
      group: 'Inputs',
      set: function (value) {
        //  this._internal.scriptInputs = value;   
      }
    },
    scriptOutputs: {
      type: { name: 'proplist', allowEditOnly: true },
      group: 'Outputs',
      set: function (value) {
        //   this._internal.scriptOutputs = value;   
      }
    },*/
    requestScript: {
      type: {
        name: 'string',
        allowEditOnly: true,
        codeeditor: 'javascript'
      },
      displayName: 'Request',
      default: defaultRequestScript,
      group: 'Scripts',
      set: function (script) {
        try {
          this._internal.requestFunc = new Function('Inputs', 'Outputs', 'Request', script);
        } catch (e) {
          console.log(e);
        }
      }
    },
    responseScript: {
      type: {
        name: 'string',
        allowEditOnly: true,
        codeeditor: 'javascript'
      },
      displayName: 'Response',
      default: defaultResponseScript,
      group: 'Scripts',
      set: function (script) {
        try {
          this._internal.responseFunc = new Function('Inputs', 'Outputs', 'Response', script);
        } catch (e) {
          console.log(e);
        }
      }
    },
    fetch: {
      type: 'signal',
      displayName: 'Fetch',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleFetch();
      }
    },
    cancel: {
      type: 'signal',
      displayName: 'Cancel',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.cancelFetch();
      }
    }
  },
  outputs: {
    failure: {
      type: 'signal',
      displayName: 'Failure',
      group: 'Events'
    },
    success: {
      type: 'signal',
      displayName: 'Success',
      group: 'Events'
    },
    canceled: {
      type: 'signal',
      displayName: 'Canceled',
      group: 'Events'
    }
  },
  prototypeExtensions: {
    getScriptOutputValue: function (name) {
      return this._internal.outputValues[name];
    },
    setScriptInputValue: function (name, value) {
      return (this._internal.inputValues[name] = value);
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name.startsWith('out-'))
        return this.registerOutput(name, {
          getter: this.getScriptOutputValue.bind(this, name.substring('out-'.length))
        });
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('in-'))
        return this.registerInput(name, {
          set: this.setScriptInputValue.bind(this, name.substring('in-'.length))
        });

      /*    if (name.startsWith('intype-')) return this.registerInput(name, {
        set: function() {} // Ignore input type
      })

      if (name.startsWith('outtype-')) return this.registerInput(name, {
        set: function() {} // Ignore output type
      })*/
    },
    scheduleFetch: function () {
      var internal = this._internal;
      if (!internal.hasScheduledFetch) {
        internal.hasScheduledFetch = true;
        this.scheduleAfterInputsHaveUpdated(this.doFetch.bind(this));
      }
    },
    doResponse: function (status, response, request) {
      // Process the response content with the response function
      if (this._internal.responseFunc) {
        this._internal.responseFunc.apply(this._internal.self, [
          this._internal.inputValues,
          this._internal.outputValuesProxy,
          { status: status, content: response, request: request }
        ]);
      }

      this._internal.inspectData = { status: status, content: response };

      // Flag status
      if (status >= 200 && status < 300) {
        this.sendSignalOnOutput('success');
      } else {
        this.sendSignalOnOutput('failure');
      }
    },
    doExternalFetch: function (request) {
      var url = request.resource;

      // Append parameters from request as query
      if (Object.keys(request.parameters).length > 0) {
        var parameters = Object.keys(request.parameters).map(function (p) {
          return p + '=' + encodeURIComponent(request.parameters[p]);
        });
        url += '?' + parameters.join('&');
      }

      if (typeof _noodl_cloud_runtime_version === 'undefined') {
        // Running in browser
        var _this = this;
        var xhr = new window.XMLHttpRequest();
        this._xhr = xhr;

        xhr.open(request.method, url, true);
        for (var header in request.headers) {
          xhr.setRequestHeader(header, request.headers[header]);
        }
        xhr.onreadystatechange = function () {
          // XMLHttpRequest.DONE = 4, but torped runtime doesn't support enum

          var sentResponse = false;

          if (this.readyState === 4 || this.readyState === XMLHttpRequest.DONE) {
            var statusCode = this.status;
            var responseType = this.getResponseHeader('content-type');
            var rawResponse = this.response;
            delete this._xhr;

            if (responseType) {
              responseType = responseType.toLowerCase();
              const responseData = responseType.indexOf('json') !== -1 ? JSON.parse(rawResponse) : rawResponse;

              _this.doResponse(statusCode, responseData, request);
              sentResponse = true;
            }

            if (sentResponse === false) {
              _this.doResponse(statusCode, rawResponse, request);
            }
          }
        };
        xhr.onerror = function (e) {
          //console.log('REST: Failed to request', url);
          delete this._xhr;
          _this.sendSignalOnOutput('failure');
        };

        xhr.onabort = function () {
          delete this._xhr;
          _this.sendSignalOnOutput('canceled');
        };

        if (request.content) {
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify(request.content));
        } else {
          xhr.send();
        }
      } else {
        // Running in cloud runtime
        const headers = Object.assign(
          {},
          request.headers,
          request.content
            ? {
                'Content-Type': 'application/json'
              }
            : {}
        );
        fetch(url, {
          method: request.method,
          headers,
          body: request.content ? JSON.stringify(request.content) : undefined
        })
          .then((response) => {
            const responseType = response.headers.get('content-type');
            if (responseType) {
              if (responseType.indexOf('/json') !== -1) {
                response.json().then((json) => {
                  this.doResponse(response.status, json, request);
                });
              } else {
                if (this.context.editorConnection) {
                  this.context.editorConnection.sendWarning(
                    this.nodeScope.componentOwner.name,
                    this.id,
                    'rest-run-waring-',
                    {
                      message: 'REST only supports json content type in response.'
                    }
                  );
                }
              }
            } else {
              response.text().then((raw) => {
                this.doResponse(response.status, raw, request);
              });
            }
          })
          .catch((e) => {
            console.log('REST: Failed to request', url);
            console.log(e);
            this.sendSignalOnOutput('failure');
          });
      }
    },
    doFetch: function () {
      this._internal.hasScheduledFetch = false;

      // Format resource path
      var resource = this._internal.resource;
      if (resource) {
        for (var key in this._internal.inputValues) {
          resource = resource.replace('{' + key + '}', this._internal.inputValues[key]);
        }
      }

      // Setup the request
      var request = {
        resource: resource,
        headers: {},
        method: this._internal.method !== undefined ? this._internal.method : 'GET',
        parameters: {}
      };

      // Process the request content with the preprocess function
      if (this._internal.requestFunc) {
        this._internal.requestFunc.apply(this._internal.self, [
          this._internal.inputValues,
          this._internal.outputValuesProxy,
          request
        ]);
      }

      // Perform request
      this.doExternalFetch(request);
    },
    cancelFetch: function () {
      if (typeof _noodl_cloud_runtime_version === 'undefined') {
        this._xhr && this._xhr.abort();
      } else {
        if (this.context.editorConnection) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'rest-run-waring-', {
            message: "REST doesn't support cancel in cloud functions."
          });
        }
      }
    }
  }
};

function _parseScriptForErrors(script, args, name, node, context, ports) {
  // Clear run warnings if the script is edited
  context.editorConnection.clearWarning(node.component.name, node.id, 'rest-run-waring-' + name);

  if (script === undefined) {
    context.editorConnection.clearWarning(node.component.name, node.id, 'rest-parse-waring-' + name);
    return;
  }

  try {
    new Function(...args, script);

    context.editorConnection.clearWarning(node.component.name, node.id, 'rest-parse-waring-' + name);
  } catch (e) {
    context.editorConnection.sendWarning(node.component.name, node.id, 'rest-parse-waring-' + name, {
      message: '<strong>' + name + '</strong>: ' + e.message,
      showGlobally: true
    });
  }

  // Extract inputs and outputs
  function _exists(port) {
    return ports.find((p) => p.name === port) !== undefined;
  }

  const scriptWithoutComments = script.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove comments
  const inputs = scriptWithoutComments.match(/Inputs\.[A-Za-z0-9]+/g);
  if (inputs) {
    const unique = {};
    inputs.forEach((v) => {
      unique[v.substring('Inputs.'.length)] = true;
    });

    Object.keys(unique).forEach((p) => {
      if (_exists('in-' + p)) return;

      ports.push({
        name: 'in-' + p,
        displayName: p,
        plug: 'input',
        type: '*',
        group: 'Inputs'
      });
    });
  }

  const outputs = scriptWithoutComments.match(/Outputs\.[A-Za-z0-9]+/g);
  if (outputs) {
    const unique = {};
    outputs.forEach((v) => {
      unique[v.substring('Outputs.'.length)] = true;
    });

    Object.keys(unique).forEach((p) => {
      if (_exists('out-' + p)) return;

      ports.push({
        name: 'out-' + p,
        displayName: p,
        plug: 'output',
        type: '*',
        group: 'Outputs'
      });
    });
  }
}

module.exports = {
  node: RestNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection) {
      return;
    }

    function _managePortsForNode(node) {
      function _updatePorts() {
        if (!node.parameters) {
          return;
        }

        var ports = [];
        function exists(name) {
          for (var i = 0; i < ports.length; i++) if (ports[i].name === name && ports[i].plug === 'input') return true;
          return false;
        }

        /*  const _typeEnums = [{value:'string',label:'String'},
                                {value:'boolean',label:'Boolean'},
                                {value:'number',label:'Number'},
                                {value:'color',label:'Color'},
                                {value:'object',label:'Object'},
                                {value:'array',label:'Array'}]*/

        // Inputs
        /* if (node.parameters['scriptInputs'] !== undefined && node.parameters['scriptInputs'].length > 0) {
          node.parameters['scriptInputs'].forEach((p) => {
            // Type for input
            ports.push({
              name: 'intype-' + p.label,
              displayName: 'Type',
              plug: 'input',
              type: { name: 'enum', enums: _typeEnums, allowEditOnly: true },
              default: 'string',
              parent: 'scriptInputs',
              parentItemId: p.id
            })
      
            // Default Value for input
            ports.push({
              name: 'in-' + p.label,
              displayName: p.label,
              plug: 'input',
              type: node.parameters['intype-' + p.label] || 'string',
              group: 'Input Values'
            })
          })
        }*/

        // Outputs
        /* if (node.parameters['scriptOutputs'] !== undefined && node.parameters['scriptOutputs'].length > 0) {
          node.parameters['scriptOutputs'].forEach((p) => {
            // Type for output
            ports.push({
              name: 'outtype-' + p.label,
              displayName: 'Type',
              plug: 'input',
              type: { name: 'enum', enums: _typeEnums, allowEditOnly: true },
              default: 'string',
              parent: 'scriptOutputs',
              parentItemId: p.id
            })
      
            // Value for output
            ports.push({
              name: 'out-' + p.label,
              displayName: p.label,
              plug: 'output',
              type: node.parameters['outtype-' + p.label] || '*',
              group: 'Outputs',
            })
          })
        }*/

        // Parse resource path inputs
        if (node.parameters.resource) {
          var inputs = node.parameters.resource.match(/\{[A-Za-z0-9_]*\}/g);
          for (var i in inputs) {
            var def = inputs[i];
            var name = def.replace('{', '').replace('}', '');
            if (exists('in-' + name)) continue;

            ports.push({
              name: 'in-' + name,
              displayName: name,
              type: 'string',
              plug: 'input',
              group: 'Inputs'
            });
          }
        }

        if (node.parameters['requestScript']) {
          _parseScriptForErrors(
            node.parameters['requestScript'],
            ['Inputs', 'Outputs', 'Request'],
            'Request script',
            node,
            context,
            ports
          );
        }

        if (node.parameters['responseScript']) {
          _parseScriptForErrors(
            node.parameters['responseScript'],
            ['Inputs', 'Outputs', 'Response'],
            'Response script',
            node,
            context,
            ports
          );
        }

        context.editorConnection.sendDynamicPorts(node.id, ports);
      }

      _updatePorts();
      node.on('parameterUpdated', function () {
        _updatePorts();
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.REST2', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('REST2')) {
        _managePortsForNode(node);
      }
    });
  }
};
