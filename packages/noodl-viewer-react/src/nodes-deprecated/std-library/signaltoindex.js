'use strict';

const { EdgeTriggeredInput } = require('@noodl/runtime');

const SignalToIndexNode = {
  name: 'Signal To Index',
  docs: 'https://docs.noodl.net/nodes/logic/signal-to-index',
  shortDesc: 'Maps signal inputs to their index value.',
  category: 'Logic',
  deprecated: true,
  initialize: function () {
    this._internal.currentIndex = 0;
  },
  getInspectInfo() {
    return 'Index: ' + this._internal.currentIndex;
  },
  numberedInputs: {
    input: {
      type: 'boolean',
      displayPrefix: 'Signal',
      createSetter: function (index) {
        return EdgeTriggeredInput.createSetter({
          valueChangedToTrue: this.onValueChangedToTrue.bind(this, index)
        });
      },
      selectors: {
        startIndex: {
          displayName: 'Start Index',
          set: function (index) {
            this._internal.currentIndex = index;
            this.flagOutputDirty('index');
          }
        }
      }
    }
  },
  outputs: {
    index: {
      displayName: 'Index',
      type: 'number',
      getter: function () {
        return this._internal.currentIndex;
      }
    },
    signalTriggered: {
      displayName: 'Signal Triggered',
      type: 'signal'
    }
  },
  prototypeExtensions: {
    onValueChangedToTrue: function (index) {
      this.sendSignalOnOutput('signalTriggered');

      if (this._internal.currentIndex === index) {
        return;
      }

      this._internal.currentIndex = index;
      this.flagOutputDirty('index');
    }
  }
};

module.exports = {
  node: SignalToIndexNode
};
