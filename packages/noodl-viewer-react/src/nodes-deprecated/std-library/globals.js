'use strict';
const { Node } = require('@noodl/runtime');

const GlobalsNode = {
  name: 'Globals',
  shortDesc: 'A node used to communicate values across the project.',
  category: 'Utilities',
  color: 'component',
  deprecated: true, // use variable instead
  initialize: function () {
    this._internal.listeners = [];
  },
  panels: [
    {
      name: 'PortEditor',
      context: ['select', 'connectTo', 'connectFrom'],
      title: 'Globals',
      plug: 'input/output',
      type: {
        name: '*'
      }
    }
  ],
  prototypeExtensions: {
    _onNodeDeleted: function () {
      Node.prototype._onNodeDeleted.call(this);
      var globalsEmitter = this.context.globalsEventEmitter;

      for (var i = 0; i < this._internal.listeners.length; i++) {
        var listener = this._internal.listeners[i];
        globalsEmitter.removeListener(listener.name, listener.listener);
      }
      this._internal.listeners = [];
    },
    _newOutputValueReceived: {
      value: function (name) {
        this._cachedInputValues[name] = this.context.globalValues[name];
        this.flagOutputDirty(name);
      }
    },
    registerInputIfNeeded: {
      value: function (name) {
        var self = this;

        if (this.hasInput(name)) {
          return;
        }
        this.registerInput(name, {
          set: self.context.setGlobalValue.bind(self.context, name)
        });
      }
    },
    registerOutputIfNeeded: {
      value: function (name) {
        if (this.hasOutput(name)) {
          return;
        }

        var newOutputValueReceivedCallback = this._newOutputValueReceived.bind(this, name);

        var globalsEmitter = this.context.globalsEventEmitter;

        this._internal.listeners.push({
          name: name,
          listener: newOutputValueReceivedCallback
        });

        globalsEmitter.on(name, newOutputValueReceivedCallback);

        this.registerOutput(name, {
          getter: function () {
            return this.context.globalValues[name];
          }
        });
      }
    }
  }
};

module.exports = {
  node: GlobalsNode
};
