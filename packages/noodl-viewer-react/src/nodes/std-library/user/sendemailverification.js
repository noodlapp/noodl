'use strict';

const { Node, EdgeTriggeredInput } = require('@noodl/runtime');
const UserService = require('./userservice');

var SendEmailVerificationNodeDefinition = {
  name: 'net.noodl.user.SendEmailVerification',
  docs: 'https://docs.noodl.net/nodes/data/user/send-email-verification',
  displayNodeName: 'Send Email Verification',
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
    send: {
      displayName: 'Do',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleSendEmailVerification();
      }
    },
    email: {
      type: 'string',
      displayName: 'Email',
      group: 'General',
      set: function (value) {
        this._internal.email = value;
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
          'user-send-email-verification-warning',
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
          'user-send-email-verification-warning'
        );
      }
    },
    scheduleSendEmailVerification: function () {
      const internal = this._internal;

      if (this.sendScheduled === true) return;
      this.sendScheduled = true;

      this.scheduleAfterInputsHaveUpdated(() => {
        this.sendScheduled = false;

        UserService.instance.sendEmailVerification({
          email: this._internal.email,
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
  node: SendEmailVerificationNodeDefinition,
  setup: function (context, graphModel) {}
};
