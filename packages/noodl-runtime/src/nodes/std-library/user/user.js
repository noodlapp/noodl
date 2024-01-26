'use strict';

const NoodlRuntime = require('../../../../noodl-runtime');
const { Node } = require('../../../../noodl-runtime');

var UserNodeDefinition = {
  name: 'net.noodl.user.User',
  docs: 'https://docs.noodl.net/nodes/data/user/user-node',
  displayNodeName: 'User',
  category: 'Cloud Services',
  color: 'data',
  initialize: function () {
    var _this = this;
    this._internal.onModelChangedCallback = function (args) {
      if (_this.isInputConnected('fetch')) return;

      if (_this.hasOutput('prop-' + args.name)) _this.flagOutputDirty('prop-' + args.name);

      if (_this.hasOutput('changed-' + args.name)) _this.sendSignalOnOutput('changed-' + args.name);

      _this.sendSignalOnOutput('changed');
    };

    const userService = NoodlRuntime.Services.UserService.forScope(this.nodeScope.modelScope);

    this.setUserModel(userService.current);
    userService.on('loggedIn', () => {
      this.setUserModel(userService.current);

      if (this.hasOutput('loggedIn')) this.sendSignalOnOutput('loggedIn');
    });

    userService.on('sessionGained', () => {
      this.setUserModel(userService.current);
    });

    userService.on('loggedOut', () => {
      this.setUserModel(undefined);
      if (this.hasOutput('loggedOut')) this.sendSignalOnOutput('loggedOut');
    });

    userService.on('sessionLost', () => {
      this.setUserModel(undefined);
      if (this.hasOutput('sessionLost')) this.sendSignalOnOutput('sessionLost');
    });
  },
  getInspectInfo() {
    const model = this._internal.model;
    if (!model) return '[No Model]';

    return [
      { type: 'text', value: 'Id: ' + model.getId() },
      { type: 'value', value: this._internal.model.data }
    ];
  },
  outputs: {
    id: {
      type: 'string',
      displayName: 'Id',
      group: 'General',
      getter: function () {
        return this._internal.model !== undefined ? this._internal.model.getId() : undefined;
      }
    },
    fetched: {
      type: 'signal',
      displayName: 'Fetched',
      group: 'Events'
    },
    changed: {
      type: 'signal',
      displayName: 'Changed',
      group: 'Events'
    },
    failure: {
      type: 'signal',
      displayName: 'Failure',
      group: 'Events'
    },
    error: {
      type: 'string',
      displayName: 'Error',
      group: 'Error',
      getter: function () {
        return this._internal.error;
      }
    },
    username: {
      type: 'string',
      displayName: 'Username',
      group: 'General',
      getter: function () {
        return this._internal.model !== undefined ? this._internal.model.get('username') : undefined;
      }
    },
    email: {
      type: 'string',
      displayName: 'Email',
      group: 'General',
      getter: function () {
        return this._internal.model !== undefined ? this._internal.model.get('email') : undefined;
      }
    },
    authenticated: {
      type: 'boolean',
      displayName: 'Authenticated',
      group: 'General',
      getter: function () {
        return this._internal.model !== undefined;
      }
    }
    /*    loggedIn:{
            type:'signal',
            displayName:'Logged In',
            group:'Events'
        },
        loggedOut:{
            type:'signal',
            displayName:'Logged Out',
            group:'Events'
        },
        sessionLost:{
            type:'signal',
            displayName:'Session Lost',
            group:'Events'
        },         */
  },
  inputs: {
    fetch: {
      displayName: 'Fetch',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleFetch();
      }
    }
  },
  methods: {
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
      if (this._internal.model) this._internal.model.off('change', this._internal.onModelChangedCallback);
    },
    scheduleOnce: function (type, cb) {
      const _this = this;
      const _type = 'hasScheduled' + type;
      if (this._internal[_type]) return;
      this._internal[_type] = true;
      this.scheduleAfterInputsHaveUpdated(function () {
        _this._internal[_type] = false;
        cb();
      });
    },
    setError: function (err) {
      this._internal.error = err;
      this.flagOutputDirty('error');
      this.sendSignalOnOutput('failure');

      if (this.context.editorConnection) {
        this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'user-warning', {
          message: err,
          showGlobally: true
        });
      }
    },
    clearWarnings() {
      if (this.context.editorConnection) {
        this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'user-warning');
      }
    },
    setUserModel(model) {
      const internal = this._internal;

      if (internal.model !== model) {
        // Check if we need to change model
        if (internal.model)
          // Remove old listener if existing
          internal.model.off('change', internal.onModelChangedCallback);

        internal.model = model;
        if (model) model.on('change', internal.onModelChangedCallback);
      }
      this.flagOutputDirty('id');
      this.flagOutputDirty('authenticated');
      this.flagOutputDirty('email');
      this.flagOutputDirty('username');

      // Notify all properties changed
      if (model)
        for (var key in model.data) {
          if (this.hasOutput('prop-' + key)) this.flagOutputDirty('prop-' + key);
        }
    },
    scheduleFetch: function () {
      const internal = this._internal;

      this.scheduleOnce('Fetch', () => {
        const userService = NoodlRuntime.Services.UserService.forScope(this.nodeScope.modelScope);
        userService.fetchCurrentUser({
          success: (response) => {
            this.setUserModel(userService.current);

            this.sendSignalOnOutput('fetched');
          },
          error: (err) => {
            this.setError(err || 'Failed to fetch.');
          }
        });
      });
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name === 'loggedOut' || name === 'loggedIn' || name === 'sessionLost') {
        this.registerOutput(name, {
          getter: () => {} /* No getter needed, signal */
        });
        return;
      }

      if (name.startsWith('prop-'))
        this.registerOutput(name, {
          getter: this.getUserProperty.bind(this, name.substring('prop-'.length))
        });
    },
    getUserProperty: function (name) {
      return this._internal.model !== undefined ? this._internal.model.get(name) : undefined;
    }
  }
};

function updatePorts(nodeId, parameters, editorConnection, systemCollections) {
  var ports = [];

  if (systemCollections) {
    // Fetch ports from collection keys
    var c = systemCollections.find((c) => c.name === '_User');
    if (c && c.schema && c.schema.properties) {
      var props = c.schema.properties;
      const _ignoreKeys = ['authData', 'password', 'username', 'email'];
      for (var key in props) {
        if (_ignoreKeys.indexOf(key) !== -1) continue;

        var p = props[key];
        if (ports.find((_p) => _p.name === key)) continue;

        if (p.type === 'Relation') {
        } else {
          // Other schema type ports
          const _typeMap = {
            String: 'string',
            Boolean: 'boolean',
            Number: 'number',
            Date: 'date'
          };

          ports.push({
            type: {
              name: _typeMap[p.type] ? _typeMap[p.type] : '*'
            },
            plug: 'output',
            group: 'Properties',
            name: 'prop-' + key,
            displayName: key
          });

          ports.push({
            type: 'signal',
            plug: 'output',
            group: 'Changed Events',
            displayName: key + ' Changed',
            name: 'changed-' + key
          });
        }
      }
    }
  }

  if (typeof _noodl_cloud_runtime_version === 'undefined') {
    // On the client we have some extra outputs
    ports.push({
      plug: 'output',
      name: 'loggedIn',
      type: 'signal',
      displayName: 'Logged In',
      group: 'Events'
    });

    ports.push({
      plug: 'output',
      name: 'loggedOut',
      type: 'signal',
      displayName: 'Logged Out',
      group: 'Events'
    });

    ports.push({
      plug: 'output',
      name: 'sessionLost',
      type: 'signal',
      displayName: 'Session Lost',
      group: 'Events'
    });
  }

  editorConnection.sendDynamicPorts(nodeId, ports);
}

module.exports = {
  node: UserNodeDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('systemCollections'));

      node.on('parameterUpdated', function (event) {
        updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('systemCollections'));
      });

      graphModel.on('metadataChanged.systemCollections', function (data) {
        updatePorts(node.id, node.parameters, context.editorConnection, data);
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.net.noodl.user.User', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('net.noodl.user.User')) {
        _managePortsForNode(node);
      }
    });
  }
};
