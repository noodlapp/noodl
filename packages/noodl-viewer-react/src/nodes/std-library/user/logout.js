'use strict';

const UserService = require('./userservice');

const LogOutNodeDefinition = {
  name: 'net.noodl.user.LogOut',
  docs: 'https://docs.noodl.net/nodes/data/user/log-out',
  displayNodeName: 'Log Out',
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
        this.scheduleLogOut();
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
    scheduleLogOut() {
      if (this.logOutScheduled === true) return;
      this.logOutScheduled = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.logOutScheduled = false;

        UserService.instance.logOut({
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
  node: LogOutNodeDefinition,
  setup(_context, _graphModel) {}
};
