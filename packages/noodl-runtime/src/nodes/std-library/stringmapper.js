const StringMapperNode = {
  name: 'String Mapper',
  docs: 'https://docs.noodl.net/nodes/string-manipulation/string-mapper',
  category: 'Utilities',
  initialize: function () {
    this._internal.inputs = [];
    this._internal.mappings = [];
  },
  getInspectInfo() {
    return this._internal.mappedString;
  },
  numberedInputs: {
    input: {
      type: 'string',
      displayPrefix: 'Input',
      group: 'Inputs',
      index: 10,
      createSetter(index) {
        return function (value) {
          value = value === undefined ? '' : value.toString();
          this._internal.inputs[index] = value;
          this.scheduleMapping();
        };
      }
    },
    output: {
      type: 'string',
      displayPrefix: 'Mapping',
      index: 1001,
      group: 'Mappings',
      createSetter(index) {
        return function (value) {
          value = value === undefined ? '' : value.toString();
          this._internal.mappings[index] = value;
          this.scheduleMapping();
        };
      }
    }
  },
  inputs: {
    inputString: {
      type: {
        name: 'string'
      },
      index: 1,
      displayName: 'Input String',
      set: function (value) {
        this._internal.currentInputString = value !== undefined ? value.toString() : undefined;
        this.scheduleMapping();
      }
    },
    defaultMapping: {
      type: 'string',
      displayName: 'Default',
      index: 1000,
      group: 'Mappings',
      set: function (value) {
        this._internal.defaultMapping = value;
        this.scheduleMapping();
      }
    }
  },
  outputs: {
    mappedString: {
      type: 'string',
      displayName: 'Mapped String',
      group: 'Value',
      getter: function () {
        return this._internal.mappedString;
      }
    }
  },
  prototypeExtensions: {
    doMapping: function () {
      this._internal.hasScheduledFetch = false;
      var idx = this._internal.inputs.indexOf(this._internal.currentInputString);
      if (idx !== -1) this._internal.mappedString = this._internal.mappings[idx];
      else this._internal.mappedString = this._internal.defaultMapping;

      this.flagOutputDirty('mappedString');
    },
    scheduleMapping: function () {
      var internal = this._internal;
      if (!internal.hasScheduledFetch) {
        internal.hasScheduledFetch = true;
        this.scheduleAfterInputsHaveUpdated(this.doMapping.bind(this));
      }
    }
  }
};

module.exports = {
  node: StringMapperNode
};
