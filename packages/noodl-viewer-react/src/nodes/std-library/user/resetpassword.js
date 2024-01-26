'use strict';

const { Node, EdgeTriggeredInput } = require('@noodl/runtime');
const UserService = require('./userservice');

var ResetPasswordNodeDefinition = {
  name: 'net.noodl.user.ResetPassword',
  docs: 'https://docs.noodl.net/nodes/data/user/reset-password',
  displayNodeName: 'Reset Password',
  category: 'Cloud Services',
  color: 'data',
  deprecated: true, // Use cloud functions
  initialize: function () {
    var internal = this._internal;
  },
  getInspectInfo() {},
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
      getter: function () {
        return this._internal.error;
      }
    }
  },
  inputs: {
    reset: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleResetPassword();
      }
    },
    token: {
      type: 'string',
      displayName: 'Token',
      group: 'General',
      set: function (value) {
        this._internal.token = value;
      }
    },
    username: {
      type: 'string',
      displayName: 'Username',
      group: 'General',
      set: function (value) {
        this._internal.username = value;
      }
    },
    newPassword: {
      type: 'string',
      displayName: 'New Password',
      group: 'General',
      set: function (value) {
        this._internal.newPassword = value;
      }
    }
  },
  methods: {
    setError: function (err) {
      this._internal.error = err;
      this.flagOutputDirty('error');
      this.sendSignalOnOutput('failure');

      if (this.context.editorConnection) {
        this.context.editorConnection.sendWarning(
          this.nodeScope.componentOwner.name,
          this.id,
          'user-verify-email-warning',
          {
            message: err,
            showGlobally: true
          }
        );
      }
    },
    clearWarnings() {
      if (this.context.editorConnection) {
        this.context.editorConnection.clearWarning(
          this.nodeScope.componentOwner.name,
          this.id,
          'user-verify-email-warning'
        );
      }
    },
    scheduleResetPassword: function () {
      const internal = this._internal;

      if (this.resetPasswordScheduled === true) return;
      this.resetPasswordScheduled = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.resetPasswordScheduled = false;

        UserService.instance.resetPassword({
          token: this._internal.token,
          username: this._internal.username,
          newPassword: this._internal.newPassword,
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
  node: ResetPasswordNodeDefinition,
  setup: function (context, graphModel) {}
};
