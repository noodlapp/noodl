const NoodlRuntime = require('@noodl/runtime');
const CloudStore = require('@noodl/runtime/src/api/cloudstore');

('use strict');

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

  const cloudServices = NoodlRuntime.instance.getMetaData('cloudservices');
  if (cloudServices && cloudServices.deployVersion) {
    xhr.setRequestHeader('x-noodl-cloud-version', cloudServices.deployVersion);
  }

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
  name: 'CloudFunction2',
  displayName: 'Cloud Function',
  category: 'Cloud Services',
  color: 'data',
  usePortAsLabel: 'function',
  docs: 'https://docs.noodl.net/nodes/data/cloud-data/cloud-function',
  initialize: function () {
    this._internal.paramsValues = {};
    this._internal.resultsValues = {};
  },
  getInspectInfo() {
    const result = this._internal.lastCallResult;
    if (!result) return '[Not executed yet]';

    return [{ type: 'value', value: result }];
  },
  inputs: {
    call: {
      type: 'signal',
      displayName: 'Call',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleCall();
      }
    }
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
    error: {
      type: 'string',
      displayName: 'Error',
      group: 'Error',
      getter: function () {
        return this._internal.error;
      }
    }
  },
  methods: {
    setError: function (err) {
      this._internal.error = err;
      this.flagOutputDirty('error');
      this.sendSignalOnOutput('failure');
    },
    getResultsValue: function (name) {
      return this._internal.resultsValues[name];
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name.startsWith('out-'))
        this.registerOutput(name, {
          getter: this.getResultsValue.bind(this, name.substring('out-'.length))
        });
    },
    setParamsValue: function (name, value) {
      this._internal.paramsValues[name] = value;
    },
    setFunctionName: function (value) {
      this._internal.functionName = value;
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name === 'function')
        this.registerInput(name, {
          set: this.setFunctionName.bind(this)
        });

      if (name.startsWith('in-'))
        this.registerInput(name, {
          set: this.setParamsValue.bind(this, name.substring('in-'.length))
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
      if (this.context.editorConnection) {
        if (cloudServices === undefined || cloudServices.endpoint === undefined) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'cloud-function-2', {
            message: 'No cloud services defined in this project.'
          });
        } else if (this._internal.functionName === undefined) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'cloud-function-2', {
            message: 'No function specified'
          });
        } else {
          this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'cloud-function-2');
        }
      }

      const appId = cloudServices.appId;
      const endpoint = this.context.editorConnection.isRunningLocally()
        ? `http://${window.location.hostname}:8577`
        : cloudServices.endpoint;

      _makeRequest('/functions/' + encodeURIComponent(this._internal.functionName), {
        appId,
        endpoint,
        content: this._internal.paramsValues,
        method: 'POST',
        success: (res) => {
          if (res === undefined) {
            // No result, still success

            this._internal.lastCallResult = {
              status: 'success',
              parameters: this._internal.paramsValues,
              results: 'empty'
            };
          } else {
            const results = res.result || {};
            for (let key in results) {
              this._internal.resultsValues[key] = results[key];
              if (this.hasOutput('out-' + key)) this.flagOutputDirty('out-' + key);
            }

            this._internal.lastCallResult = {
              status: 'success',
              parameters: this._internal.paramsValues,
              results: this._internal.resultsValues
            };
          }

          this.sendSignalOnOutput('success');
        },
        error: (e) => {
          const error = typeof e === 'string' ? e : e.error || 'Failed running cloud function.';
          this._internal.lastCallResult = {
            status: 'failure',
            error
          };

          this.setError(error);
        }
      });
    }
  }
};

module.exports = {
  node: CloudFunctionNode,
  setup: function (context, graphModel) {
    // Handled in editor adapter
  }
};
