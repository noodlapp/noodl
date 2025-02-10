'use strict';

const UserService = require('./userservice');

const LoginNodeDefinition = {
  name: 'net.noodl.user.LogIn',
  docs: 'https://docs.noodl.net/nodes/data/user/log-in',
  displayNodeName: 'Log In',
  category: 'Cloud Services',
  color: 'data',
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
    login: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue() {
        this.scheduleLogIn();
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
    scheduleLogIn() {
      if (this.logInScheduled === true) return;
      this.logInScheduled = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.logInScheduled = false;

        UserService.instance.logIn({
          username: this._internal.username,
          password: this._internal.password,
          success: () => {
            this.sendSignalOnOutput('success');
          },
          error: (e) => {
            this.setError(e);
          }
        });
      });
    }
  }
};

module.exports = {
  node: LoginNodeDefinition,
  setup(_context, _graphModel) {}
};
