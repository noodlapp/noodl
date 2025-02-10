const NavigateBack = {
  name: 'PageStackNavigateBack',
  displayNodeName: 'Pop Component Stack',
  category: 'Navigation',
  docs: 'https://docs.noodl.net/nodes/component-stack/pop-component',
  inputs: {
    navigate: {
      displayName: 'Navigate',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleNavigate();
      }
    },
    results: {
      type: { name: 'stringlist', allowEditOnly: true },
      group: 'Results',
      set: function (value) {
        this._internal.results = value;
      }
    },
    backActions: {
      type: { name: 'stringlist', allowEditOnly: true },
      group: 'Back Actions',
      set: function (value) {
        this._internal.backActions = value;
      }
    }
  },
  initialize: function () {
    this._internal.resultValues = {};
  },
  methods: {
    scheduleNavigate: function () {
      var _this = this;
      var internal = this._internal;
      if (!internal.hasScheduledNavigate) {
        internal.hasScheduledNavigate = true;
        this.scheduleAfterInputsHaveUpdated(function () {
          internal.hasScheduledNavigate = false;
          _this.navigate();
        });
      }
    },
    _setBackCallback(cb) {
      this._internal.backCallback = cb;
    },
    navigate() {
      if (this._internal.backCallback === undefined) return;

      this._internal.backCallback({
        backAction: this._internal.backAction,
        results: this._internal.resultValues
      });
    },
    setResultValue: function (key, value) {
      this._internal.resultValues[key] = value;
    },
    backActionTriggered: function (name) {
      this._internal.backAction = name;
      this.scheduleNavigate();
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('result-')) {
        return this.registerInput(name, {
          set: this.setResultValue.bind(this, name.substring('result-'.length))
        });
      }

      if (name.startsWith('backAction-')) {
        return this.registerInput(name, {
          set: (value) => {
            value && this.backActionTriggered(name)
          }
        });
      }
    }
  }
};

function setup(context, graphModel) {
  if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
    return;
  }

  function _managePortsForNode(node) {
    function _updatePorts() {
      var ports = [];

      // Add results inputs
      var results = node.parameters.results;
      if (results) {
        results = results ? results.split(',') : undefined;
        for (var i in results) {
          var p = results[i];

          ports.push({
            type: {
              name: '*'
            },
            plug: 'input',
            group: 'Results',
            name: 'result-' + p,
            displayName: p
          });
        }
      }

      // Add back actions
      var backActions = node.parameters.backActions;
      if (backActions) {
        backActions = backActions ? backActions.split(',') : undefined;
        for (var i in backActions) {
          var p = backActions[i];

          ports.push({
            type: 'signal',
            plug: 'input',
            group: 'Back Actions',
            name: 'backAction-' + p,
            displayName: p
          });
        }
      }

      context.editorConnection.sendDynamicPorts(node.id, ports);
    }

    _updatePorts();
    node.on('parameterUpdated', function (event) {
      if (event.name === 'results' || event.name === 'backActions') {
        _updatePorts();
      }
    });
  }

  graphModel.on('editorImportComplete', () => {
    graphModel.on('nodeAdded.PageStackNavigateBack', function (node) {
      _managePortsForNode(node);
    });

    for (const node of graphModel.getNodesWithType('PageStackNavigateBack')) {
      _managePortsForNode(node);
    }
  });
}

module.exports = {
  node: NavigateBack,
  setup: setup
};
