//import CloudStore from '@noodl/runtime/src/api/cloudstore'
import Model from '@noodl/runtime/src/model';
import NoodlRuntime from '@noodl/runtime';
import ConfigService from '@noodl/runtime/src/api/configservice'

export const node = {
  name: 'noodl.cloud.request',
  displayNodeName: 'Request',
  category: 'Cloud',
  docs: 'https://docs.noodl.net/nodes/cloud-functions/request',
  useVariants: false,
  mountedInput: false,
  allowAsExportRoot: false,
  singleton: true,
  color: 'data',
  connectionPanel: {
    groupPriority: ['General', 'Mounted']
  },
  outputs: {
    receive: {
      displayName: 'Received',
      type: 'signal',
      group: 'General'
    },
    auth: {
      displayName: 'Authenticated',
      type: 'boolean',
      group: 'Request',
      getter: function () {
        return !!this._internal.authenticated;
      }
    },
    userId: {
      displayName: 'User Id',
      type: 'boolean',
      group: 'Request',
      getter: function () {
        return this._internal.authUserId;
      }
    }
  },
  inputs: {
    allowNoAuth: {
      group: 'General',
      type: 'boolean',
      displayName: 'Allow Unauthenticated',
      default: false,
      set: function (value) {
        this._internal.allowNoAuth = value;
      }
    },
    params: {
      group: 'Parameters',
      type: { name: 'stringlist', allowEditOnly: true },
      set: function (value) {
        this._internal.params = value;
      }
    }
  },
  initialize: function () {
    this._internal.allowNoAuth = false;
    this._internal.requestParameters = {};
    this._internal.userProperties = {
      Authenticated: false
    };
  },
  methods: {
    getRequestParameter: function (name) {
      return this._internal.requestParameters[name];
    },
    setRequestParameter: function (name, value) {
      this._internal.requestParameters[name] = value;
      if (this.hasOutput('pm-' + name)) this.flagOutputDirty('pm-' + name);
    },
    fetchCurrentUser: async function (sessionToken) {
      return new Promise((resolve, reject) => {
        const userService = NoodlRuntime.Services.UserService.forScope(this.nodeScope.modelScope);
        userService.fetchCurrentUser({
          sessionToken,
          success: resolve,
          error: reject
        });
      });
    },
    sendRequest: async function (req) {
      const sessionToken = req.headers['x-parse-session-token'];
      let params = {};
      try {
        params = JSON.parse(req.body);
      } catch (e) {}

      if (sessionToken) {
        // There is a user token, fetch user
        try {
          await this.fetchCurrentUser(sessionToken);

          const userService = NoodlRuntime.Services.UserService.forScope(this.nodeScope.modelScope);
          const userModel = userService.current;

          this._internal.authenticated = true;
          this._internal.authUserId = userModel.getId();
          this.flagOutputDirty('userId');
        } catch (e) {
          // User could not be fetched
          if (!this._internal.allowNoAuth) throw Error('Unauthenticated requests not accepted.');
        }
      } else if (!this._internal.allowNoAuth) throw Error('Unauthenticated requests not accepted.');

      // Make sure config is cached before processing request
      await ConfigService.instance.getConfig()

      // Create request object
      const requestModel = (this.nodeScope.modelScope || Model).get('Request');
      requestModel.set('Authenticated', !!this._internal.authenticated);
      requestModel.set('UserId', this._internal.authUserId);
      requestModel.set('Parameters', params);
      requestModel.set('Headers', req.headers);

      this.flagOutputDirty('auth');

      for (let key in params) {
        this.setRequestParameter(key, params[key]);
      }
      this.sendSignalOnOutput('receive');
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name.startsWith('pm-'))
        this.registerOutput(name, {
          getter: this.getRequestParameter.bind(this, name.substring('pm-'.length))
        });
    }
  }
};

export function setup(context, graphModel) {
  if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
    return;
  }

  function _managePortsForNode(node) {
    function _updatePorts() {
      var ports = [];

      // Add params outputs
      var params = node.parameters.params;
      if (params !== undefined) {
        params = params.split(',');
        for (var i in params) {
          var p = params[i];

          ports.push({
            type: '*',
            plug: 'output',
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
    graphModel.on('nodeAdded.noodl.cloud.request', function (node) {
      _managePortsForNode(node);
    });

    for (const node of graphModel.getNodesWithType('noodl.cloud.request')) {
      _managePortsForNode(node);
    }
  });
}
