'use strict';

function createDefinition(args) {
  return {
    name: args.name,
    docs: args.docs,
    shortDesc: args.shortDesc,
    nodeDoubleClickAction: args.nodeDoubleClickAction,
    category: 'Variables',
    initialize: function () {
      this._internal.currentValue = args.startValue;
      this._internal.latestValue = 0;
    },
    getInspectInfo() {
      const type = args.type.name === 'color' ? 'color' : 'text';
      return [{ type, value: this._internal.currentValue }];
    },
    inputs: {
      value: {
        type: args.type,
        displayName: 'Value',
        default: args.startValue,
        set: function (value) {
          if (this.isInputConnected('saveValue') === false) {
            this.setValueTo(value);
          } else {
            this._internal.latestValue = value;
          }
        }
      },
      saveValue: {
        displayName: 'Set',
        valueChangedToTrue: function () {
          this.scheduleAfterInputsHaveUpdated(function () {
            this.setValueTo(this._internal.latestValue);
            this.sendSignalOnOutput('stored');
          });
        }
      }
    },
    outputs: {
      savedValue: {
        type: args.type.name,
        displayName: 'Value',
        getter: function () {
          return this._internal.currentValue;
        }
      },
      changed: {
        type: 'signal',
        displayName: 'Changed'
      },
      stored: {
        type: 'signal',
        displayName: 'Stored'
      }
    },
    prototypeExtensions: {
      setValueTo: function (value) {
        value = args.cast(value);
        const changed = this._internal.currentValue !== value;
        this._internal.currentValue = value;

        if (changed) {
          this.flagOutputDirty('savedValue');
          this.sendSignalOnOutput('changed');
          args.onChanged && args.onChanged.call(this);
        }
      }
    }
  };
}

module.exports = {
  createDefinition: createDefinition
};
