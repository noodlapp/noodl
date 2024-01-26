'use strict';

const Switch = {
  name: 'Switch',
  docs: 'https://docs.noodl.net/nodes/logic/switch',
  category: 'Logic',
  initialize: function () {
    this._internal.state = false;
    this._internal.initialized = false;
  },
  getInspectInfo() {
    return this._internal.state;
  },
  inputs: {
    on: {
      displayName: 'On',
      group: 'Change State',
      valueChangedToTrue: function () {
        if (this._internal.state === true) {
          return;
        }
        this._internal.state = true;
        this.flagOutputDirty('state');
        this.emitSignals();
      }
    },
    off: {
      displayName: 'Off',
      group: 'Change State',
      valueChangedToTrue: function () {
        if (this._internal.state === false) {
          return;
        }
        this._internal.state = false;
        this.flagOutputDirty('state');
        this.emitSignals();
      }
    },
    flip: {
      displayName: 'Flip',
      group: 'Change State',
      valueChangedToTrue: function () {
        this._internal.state = !this._internal.state;
        this.flagOutputDirty('state');
        this.emitSignals();
      }
    },
    onFromStart: {
      type: 'boolean',
      displayName: 'State',
      group: 'General',
      default: false,
      set: function (value) {
        this._internal.state = !!value;
        this.flagOutputDirty('state');
        this.emitSignals();
      }
    }
  },
  outputs: {
    state: {
      type: 'boolean',
      displayName: 'Current State',
      getter: function () {
        return this._internal.state;
      }
    },
    switchedToOn: {
      displayName: 'Switched To On',
      type: 'signal',
      group: 'Signals'
    },
    switchedToOff: {
      displayName: 'Switched To Off',
      type: 'signal',
      group: 'Signals'
    }
  },
  prototypeExtensions: {
    emitSignals: function () {
      if (this._internal.state === true) {
        this.sendSignalOnOutput('switchedToOn');
      } else {
        this.sendSignalOnOutput('switchedToOff');
      }
    }
  }
};

module.exports = {
  node: Switch
};
