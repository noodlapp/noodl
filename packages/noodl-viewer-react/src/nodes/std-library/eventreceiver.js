'use strict';

const { Node } = require('@noodl/runtime');

const EventReceiver = {
  name: 'Event Receiver',
  docs: 'https://docs.noodl.net/nodes/events/receive-event',
  displayNodeName: 'Receive Event',
  category: 'Events',
  usePortAsLabel: 'channelName',
  color: 'component',
  initialize: function () {
    var internal = this._internal;
    internal.outputValues = {};
    internal.outputNames = [];
    internal.eventReceived = false;
    internal._isEnabled = true;
    internal.channelName = '';
  },
  inputs: {
    enabled: {
      displayName: 'Enabled',
      type: 'boolean',
      default: true,
      set: function (value) {
        this._internal._isEnabled = value ? true : false;
      }
    },
    consume: {
      displayName: 'Consume',
      type: {
        name: 'enum',
        enums: [
          { label: 'Never', value: 'never' },
          { label: 'Always', value: 'always' }
        ]
      },
      default: 'never',
      set: function (value) {
        this._internal.consume = value;
      }
    },
    channelName: {
      type: { name: 'string', identifierOf: 'EventChannelName' },
      displayName: 'Channel',
      set: function (value) {
        if (this._internal.onEventReceivedCallback) {
          //remove old listener
          this.context.eventSenderEmitter.removeListener(
            this._internal.channelName,
            this._internal.onEventReceivedCallback
          );
          this._internal.onEventReceivedCallback = null;
        }

        this._internal.channelName = value;
        this.registerListenersForChannel(value);
      }
    }
  },
  outputs: {
    eventReceived: {
      displayName: 'Received',
      type: 'signal'
    }
  },
  prototypeExtensions: {
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      var self = this;

      this._internal.outputNames.push(name);
      this.registerOutput(name, {
        getter: function () {
          return self._internal.outputValues[name];
        }
      });
    },
    handleEvent: function (eventData) {
      if (this._internal._isEnabled === false) {
        return;
      }
      this.sendSignalOnOutput('eventReceived');

      for (var name in eventData) {
        if (this.hasOutput(name)) {
          this._internal.outputValues[name] = eventData[name];
          this.flagOutputDirty(name);
        }
      }

      return this._internal.consume === 'always';
    },
    onEventReceived: function (eventData) {
      this.handleEvent(eventData);
    },
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
      if (this._internal.onEventReceivedCallback) {
        var eventEmitter = this.context.eventSenderEmitter;
        eventEmitter.removeListener(this._internal.channelName, this._internal.onEventReceivedCallback);
      }
    },
    registerListenersForChannel: function (channelName) {
      var eventEmitter = this.context.eventSenderEmitter;
      this._internal.onEventReceivedCallback = this.onEventReceived.bind(this);
      eventEmitter.on(channelName, this._internal.onEventReceivedCallback);

      var self = this;
      this.context.eventEmitter.once('applicationDataReloaded', function () {
        if (self._internal.onEventReceivedCallback) {
          eventEmitter.removeListener(channelName, self._internal.onEventReceivedCallback);
        }
      });
    },
    getChannelName: function () {
      return this._internal.channelName;
    }
  }
};

module.exports = {
  node: EventReceiver
};

module.exports = {
  node: EventReceiver,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function onEventReceiver(node) {
      var channelName = node.parameters.channelName;

      function _collectPayloadPorts() {
        var eventSenders = graphModel.getNodesWithType('Event Sender');
        var matching = eventSenders.filter((node) => node.parameters.channelName === channelName);

        var portKeys = {};
        matching.forEach((node) => {
          const ports = node.parameters.payload ? node.parameters.payload.split(',') : [];
          for (let key of ports) {
            portKeys[key] = true;
          }
        });

        var ports = [];
        for (var key in portKeys) {
          ports.push({
            name: key,
            type: '*',
            plug: 'output',
            displayName: key
          });
        }

        context.editorConnection.sendDynamicPorts(node.id, ports, {
          detectRenamed: {
            plug: 'output'
          }
        });
      }

      _collectPayloadPorts();
      node.on('parameterUpdated', function (event) {
        if (event.name === 'channelName') {
          channelName = event.value;
          _collectPayloadPorts();
        }
      });

      // Track all event senders and update ports when they change
      function _trackEventSender(node) {
        //_collectPayloadPorts();

        node.on('inputPortAdded', function (event) {
          _collectPayloadPorts();
        });

        node.on('inputPortRemoved', function (event) {
          _collectPayloadPorts();
        });

        node.on('parameterUpdated', function (event) {
          if (event.name === 'channelName') {
            _collectPayloadPorts();
          }
        });
      }

      graphModel.getNodesWithType('Event Sender').forEach(_trackEventSender);

      graphModel.on('nodeAdded.Event Sender', _trackEventSender);

      graphModel.on('nodeRemoved.Event Sender', (node) => {
        _collectPayloadPorts();
      });
    }

    //wait with dynamic ports until the entire graph is loaded
    graphModel.on('editorImportComplete', () => {
      //all future added nodes though delta updates
      graphModel.on('nodeAdded.Event Receiver', (node) => onEventReceiver(node));

      //existing nodes from the initial export
      graphModel.getNodesWithType('Event Receiver').forEach((node) => onEventReceiver(node));
    });
  }
};
