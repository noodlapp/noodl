'use strict';

const CounterNode = {
  name: 'Counter',
  docs: 'https://docs.noodl.net/nodes/math/counter',
  category: 'Math',
  initialize: function () {
    this._internal.currentValue = 0;
    this._internal.startValue = 0;
    this._internal.startValueSet = false;

    this._internal.limitsEnabled = false;
    this._internal.limitsMin = 0;
    this._internal.limitsMax = 0;
  },
  getInspectInfo() {
    return 'Count: ' + this._internal.currentValue;
  },
  inputs: {
    increase: {
      group: 'Actions',
      displayName: 'Increase Count',
      valueChangedToTrue: function () {
        if (this._internal.limitsEnabled && this._internal.currentValue >= this._internal.limitsMax) {
          return;
        }

        this._internal.currentValue++;
        this.flagOutputDirty('currentCount');
        this.sendSignalOnOutput('countChanged');
      }
    },
    decrease: {
      group: 'Actions',
      displayName: 'Decrease Count',
      valueChangedToTrue: function () {
        if (this._internal.limitsEnabled && this._internal.currentValue <= this._internal.limitsMin) {
          return;
        }

        this._internal.currentValue--;
        this.flagOutputDirty('currentCount');
        this.sendSignalOnOutput('countChanged');
      }
    },
    reset: {
      group: 'Actions',
      displayName: 'Reset To Start',
      valueChangedToTrue: function () {
        if (this.currentValue === 0) {
          return;
        }
        this._internal.currentValue = this._internal.startValue;
        this.flagOutputDirty('currentCount');
        this.sendSignalOnOutput('countChanged');
      }
    },
    startValue: {
      type: 'number',
      displayName: 'Start Value',
      default: 0,
      set: function (value) {
        this._internal.startValue = Number(value);

        if (this._internal.startValueSet === false) {
          this._internal.startValueSet = true;
          this._internal.currentValue = this._internal.startValue;
          this.flagOutputDirty('currentCount');
          this.sendSignalOnOutput('countChanged');
        }
      }
    },
    limitsMin: {
      type: {
        name: 'number'
      },
      displayName: 'Min Value',
      group: 'Limits',
      default: 0,
      set: function (value) {
        this._internal.limitsMin = Number(value);
      }
    },
    limitsMax: {
      type: {
        name: 'number'
      },
      displayName: 'Max Value',
      group: 'Limits',
      default: 0,
      set: function (value) {
        this._internal.limitsMax = Number(value);
      }
    },
    limitsEnabled: {
      type: {
        name: 'boolean'
      },
      displayName: 'Limits Enabled',
      group: 'Limits',
      default: false,
      set: function (value) {
        this._internal.limitsEnabled = value ? true : false;
      }
    }
  },
  outputs: {
    currentCount: {
      displayName: 'Current Count',
      type: 'number',
      getter: function () {
        return this._internal.currentValue;
      }
    },
    countChanged: {
      displayName: 'Count Changed',
      type: 'signal'
    }
  }
};

module.exports = {
  node: CounterNode
};
