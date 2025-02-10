const StringFormatDefinition = {
  name: 'String Format',
  docs: 'https://docs.noodl.net/nodes/string-manipulation/string-format',
  category: 'String Manipulation',
  usePortAsLabel: 'format',
  portLabelTruncationMode: 'length',
  initialize() {
    const internal = this._internal;
    internal.format = '';
    internal.cachedResult = '';
    internal.resultDirty = false;
    internal.inputValues = {};
  },
  getInspectInfo() {
    return this.formatValue();
  },
  inputs: {
    format: {
      type: { name: 'string', multiline: true },
      displayName: 'Format',
      set(value) {
        if (this._internal.format === value) return;

        this._internal.format = value;
        this._internal.resultDirty = true;
        this.scheduleFormat();
      }
    }
  },
  outputs: {
    formatted: {
      type: 'string',
      displayName: 'Formatted',
      get() {
        return this.formatValue();
      }
    }
  },
  methods: {
    formatValue() {
      var internal = this._internal;

      if (internal.resultDirty) {
        var formatted = internal.format;

        var matches = internal.format.match(/\{[A-Za-z0-9_]*\}/g);
        var inputs = [];
        if (matches) {
          inputs = matches.map(function (name) {
            return name.replace('{', '').replace('}', '');
          });
        }

        inputs.forEach(function (name) {
          var v = internal.inputValues[name];
          formatted = formatted.replace('{' + name + '}', v !== undefined ? v : '');
        });

        internal.cachedResult = formatted;
        internal.resultDirty = false;
      }

      return internal.cachedResult;
    },
    registerInputIfNeeded(name) {
      if (this.hasInput(name)) {
        return;
      }

      this.registerInput(name, {
        set: userInputSetter.bind(this, name)
      });
    },
    scheduleFormat() {
      if (this.formatScheduled) return;

      this.formatScheduled = true;
      this.scheduleAfterInputsHaveUpdated(() => {
        this.formatValue();
        this.flagOutputDirty('formatted');
        this.formatScheduled = false;
      });
    }
  }
};

function userInputSetter(name, value) {
  /* jshint validthis:true */
  if (this._internal.inputValues[name] === value) return;

  this._internal.inputValues[name] = value;
  this._internal.resultDirty = true;
  this.scheduleFormat();
}

function updatePorts(id, format, editorConnection) {
  var inputs = format.match(/\{[A-Za-z0-9_]*\}/g) || [];
  var portsNames = inputs.map(function (def) {
    return def.replace('{', '').replace('}', '');
  });

  var ports = portsNames
    //get unique names
    .filter(function (value, index, self) {
      return self.indexOf(value) === index;
    })
    //and map names to ports
    .map(function (name) {
      return {
        name: name,
        type: 'string',
        plug: 'input'
      };
    });

  editorConnection.sendDynamicPorts(id, ports);
}

module.exports = {
  node: StringFormatDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    graphModel.on('nodeAdded.String Format', function (node) {
      if (node.parameters.format) {
        updatePorts(node.id, node.parameters.format, context.editorConnection);
      }
      node.on('parameterUpdated', function (event) {
        if (event.name === 'format') {
          updatePorts(node.id, node.parameters.format, context.editorConnection);
        }
      });
    });
  }
};
