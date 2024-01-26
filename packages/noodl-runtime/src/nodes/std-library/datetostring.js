'use strict';

const DateToStringNode = {
  name: 'Date To String',
  docs: 'https://docs.noodl.net/nodes/utilities/date-to-string',
  category: 'Utilities',
  initialize: function () {
    this._internal.formatString = '{year}-{month}-{date}';
  },
  inputs: {
    formatString: {
      displayName: 'Format',
      type: 'string',
      default: '{year}-{month}-{date}',
      set: function (value) {
        if (this._internal.formatString === value) return;
        this._internal.formatString = value;

        if (this._internal.currentInput !== undefined) {
          this._format();
          this.flagOutputDirty('currentValue');
        }
      }
    },
    input: {
      type: { name: 'date' },
      displayName: 'Date',
      set: function (value) {
        const _value = typeof value === 'string' ? new Date(value) : value;
        if (this._internal.currentInput === _value) return;

        this._internal.currentInput = _value;
        this._format();
        this.flagOutputDirty('currentValue');
        this.sendSignalOnOutput('inputChanged');
      }
    }
  },
  outputs: {
    currentValue: {
      type: 'string',
      displayName: 'Date String',
      group: 'Value',
      getter: function () {
        return this._internal.dateString;
      }
    },
    inputChanged: {
      type: 'signal',
      displayName: 'Date Changed',
      group: 'Signals'
    }
  },
  methods: {
    _format() {
      const t = this._internal.currentInput;
      const format = this._internal.formatString;
      const date = ('0' + t.getDate()).slice(-2);
      const month = ('0' + (t.getMonth() + 1)).slice(-2);
      const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(t);
      const year = t.getFullYear();
      const hours = ('0' + t.getHours()).slice(-2);
      const minutes = ('0' + t.getMinutes()).slice(-2);
      const seconds = ('0' + t.getSeconds()).slice(-2);

      this._internal.dateString = format
        .replace(/\{date\}/g, date)
        .replace(/\{month\}/g, month)
        .replace(/\{monthShort\}/g, monthShort)
        .replace(/\{year\}/g, year)
        .replace(/\{hours\}/g, hours)
        .replace(/\{minutes\}/g, minutes)
        .replace(/\{seconds\}/g, seconds);
    }
  }
};

module.exports = {
  node: DateToStringNode
};
