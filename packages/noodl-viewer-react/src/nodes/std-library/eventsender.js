'use strict';

const EventSender = {
  name: 'Event Sender',
  docs: 'https://docs.noodl.net/nodes/events/send-event',
  displayNodeName: 'Send Event',
  category: 'Events',
  usePortAsLabel: 'channelName',
  color: 'component',
  exportDynamicPorts: true,
  initialize: function () {
    this._internal.inputValues = {};
    this._internal.channelName = '';
    this._internal.propagation = 'global';
  },
  inputs: {
    sendEvent: {
      displayName: 'Send',
      valueChangedToTrue: function () {
        var self = this;

        //wait for all other inputs to update before sending
        this.scheduleAfterInputsHaveUpdated(function () {
          if (self._internal.propagation === 'global') {
            self.context.sendGlobalEventFromEventSender(self._internal.channelName, self._internal.inputValues);
          } else {
            self.nodeScope.sendEventFromThisScope(
              self._internal.channelName,
              self._internal.inputValues,
              self._internal.propagation
            );
          }
        });
      }
    },
    channelName: {
      type: {
        name: 'string',
        allowEditOnly: true,
        identifierOf: 'EventChannelName',
        identifierDisplayName: 'Event Channels'
      },
      default: '',
      group: 'Settings',
      displayName: 'Channel Name',
      set: function (value) {
        this._internal.channelName = value;
        this._internal.inputValues._channelName = value;
      }
    },
    propagation: {
      type: {
        name: 'enum',
        enums: [
          { value: 'global', label: 'Global' },
          { value: 'parent', label: 'Parent' },
          { value: 'children', label: 'Children' },
          { value: 'siblings', label: 'Siblings' }
        ]
      },
      default: 'global',
      group: 'Settings',
      displayName: 'Send to',
      set: function (value) {
        this._internal.propagation = value;
      }
    },
    payload: {
      type: {
        name: 'stringlist',
        allowEditOnly: true
      },
      group: 'Payload'
    }
  },
  prototypeExtensions: {
    registerInputIfNeeded: {
      value: function (name) {
        if (this.hasInput(name)) {
          return;
        }
        var self = this;
        this.registerInput(name, {
          set: function (value) {
            self._internal.inputValues[name] = value;
          }
        });
      }
    }
  }
};

function updatePorts(nodeId, parameters, editorConnection) {
  var ports = [];

  // Add payload inputs
  var payload = parameters.payload;
  if (payload) {
    payload = payload.split(',');
    for (const p of payload) {
      ports.push({
        type: {
          name: '*',
          allowConnectionsOnly: true
        },
        plug: 'input',
        group: 'Payload',
        name: p,
        displayName: p
      });
    }
  }

  editorConnection.sendDynamicPorts(nodeId, ports, {
    detectRenamed: {
      plug: 'input'
    }
  });
}

module.exports = {
  node: EventSender,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    graphModel.on('nodeAdded.Event Sender', function (node) {
      updatePorts(node.id, node.parameters, context.editorConnection);

      node.on('parameterUpdated', function (event) {
        updatePorts(node.id, node.parameters, context.editorConnection);
      });
    });
  }
};
