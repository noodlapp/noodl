'use strict';

const UserService = require('./userservice');

const SignUpNodeDefinition = {
  name: 'net.noodl.user.SignUp',
  docs: 'https://docs.noodl.net/nodes/data/user/sign-up',
  displayNodeName: 'Sign Up',
  category: 'Cloud Services',
  color: 'data',
  initialize() {
    const internal = this._internal;
    internal.userProperties = {};
  },
  outputs: {
    success: {
      type: 'signal',
      displayName: 'Success',
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
      getter() {
        return this._internal.error;
      }
    }
  },
  inputs: {
    signup: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue() {
        this.scheduleSignUp();
      }
    },
    username: {
      displayName: 'Username',
      type: 'string',
      group: 'General',
      set(value) {
        this._internal.username = value;
      }
    },
    password: {
      displayName: 'Password',
      type: 'string',
      group: 'General',
      set(value) {
        this._internal.password = value;
      }
    },
    email: {
      displayName: 'Email',
      type: 'string',
      group: 'General',
      set(value) {
        this._internal.email = value;
      }
    }
  },
  methods: {
    setError(err) {
      this._internal.error = err;
      this.flagOutputDirty('error');
      this.sendSignalOnOutput('failure');

      if (this.context.editorConnection) {
        this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'user-login-warning', {
          message: err,
          showGlobally: true
        });
      }
    },
    clearWarnings() {
      if (this.context.editorConnection) {
        this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'user-login-warning');
      }
    },
    scheduleSignUp() {
      const internal = this._internal;

      if (this.signUpScheduled === true) return;
      this.signUpScheduled = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.signUpScheduled = false;

        UserService.instance.signUp({
          username: this._internal.username,
          password: this._internal.password,
          email: this._internal.email,
          properties: internal.userProperties,
          success: () => {
            this.sendSignalOnOutput('success');
          },
          error: (e) => {
            this.setError(e);
          }
        });
      });
    },
    setUserProperty(name, value) {
      this._internal.userProperties[name] = value;
    },
    registerInputIfNeeded(name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('prop-')) {
        return this.registerInput(name, {
          set: this.setUserProperty.bind(this, name.substring('prop-'.length))
        });
      }
    }
  }
};

function updatePorts(nodeId, _parameters, editorConnection, systemCollections) {
  var ports = [];

  if (systemCollections) {
    // Fetch ports from collection keys
    var c = systemCollections.find((c) => c.name === '_User');
    if (c && c.schema && c.schema.properties) {
      var props = c.schema.properties;
      const _ignoreKeys = ['authData', 'password', 'username', 'createdAt', 'updatedAt', 'emailVerified', 'email'];
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
            plug: 'input',
            group: 'Properties',
            name: 'prop-' + key,
            displayName: key
          });
        }
      }
    }
  }

  editorConnection.sendDynamicPorts(nodeId, ports);
}

module.exports = {
  node: SignUpNodeDefinition,
  setup(context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('systemCollections'));

      node.on('parameterUpdated', function (_event) {
        updatePorts(node.id, node.parameters, context.editorConnection, graphModel.getMetaData('systemCollections'));
      });

      graphModel.on('metadataChanged.systemCollections', function (data) {
        updatePorts(node.id, node.parameters, context.editorConnection, data);
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.net.noodl.user.SignUp', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('net.noodl.user.SignUp')) {
        _managePortsForNode(node);
      }
    });
  }
};
