'use strict';

const { Node, EdgeTriggeredInput } = require('@noodl/runtime');
const UserService = require('./userservice');

var VerifyEmailNodeDefinition = {
  name: 'net.noodl.user.VerifyEmail',
  docs: 'https://docs.noodl.net/nodes/data/user/verify-email',
  displayNodeName: 'Verify Email',
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
    verify: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleVerifyEmail();
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
    scheduleVerifyEmail: function () {
      const internal = this._internal;

      if (this.logOutScheduled === true) return;
      this.logOutScheduled = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.logOutScheduled = false;

        UserService.instance.verifyEmail({
          token: this._internal.token,
          username: this._internal.username,
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
  node: VerifyEmailNodeDefinition,
  setup: function (context, graphModel) {}
};
