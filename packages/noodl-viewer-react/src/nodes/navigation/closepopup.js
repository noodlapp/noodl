const { EdgeTriggeredInput } = require('@noodl/runtime');

const ClosePopupNode = {
  name: 'NavigationClosePopup',
  displayNodeName: 'Close Popup',
  category: 'Navigation',
  docs: 'https://docs.noodl.net/nodes/popups/close-popup',
  initialize: function () {
    this._internal.resultValues = {};
  },
  inputs: {
    results: {
      type: { name: 'stringlist', allowEditOnly: true },
      group: 'Results',
      set: function (value) {
        this._internal.results = value;
      }
    },
    closeActions: {
      type: { name: 'stringlist', allowEditOnly: true },
      group: 'Close Actions',
      set: function (value) {
        this._internal.closeActions = value;
      }
    },
    close: {
      type: 'Signal',
      displayName: 'Close',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleClose();
      }
    }
  },
  methods: {
    setResultValue: function (key, value) {
      this._internal.resultValues[key] = value;
    },
    _setCloseCallback: function (cb) {
      this._internal.closeCallback = cb;
    },
    scheduleClose: function () {
      const _this = this;
      const internal = this._internal;
      if (!internal.hasScheduledClose) {
        internal.hasScheduledClose = true;
        this.scheduleAfterInputsHaveUpdated(function () {
          internal.hasScheduledClose = false;
          _this.close();
        });
      }
    },
    close: function () {
      if (this._internal.closeCallback) {
        this._internal.closeCallback(this._internal.closeAction, this._internal.resultValues);
      }
    },
    closeActionTriggered: function (name) {
      this._internal.closeAction = name;
      this.scheduleClose();
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('result-'))
        return this.registerInput(name, {
          set: this.setResultValue.bind(this, name.substring('result-'.length))
        });

      if (name.startsWith('closeAction-'))
        return this.registerInput(name, {
          set: EdgeTriggeredInput.createSetter({
            valueChangedToTrue: this.closeActionTriggered.bind(this, name)
          })
        });
    }
  }
};

module.exports = {
  node: ClosePopupNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      function _updatePorts() {
        var ports = [];

        // Add results inputs
        var results = node.parameters['results'];
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

        // Add close actions
        var closeActions = node.parameters['closeActions'];
        if (closeActions) {
          closeActions = closeActions ? closeActions.split(',') : undefined;
          for (const i in closeActions) {
            const p = closeActions[i];
            ports.push({
              type: 'signal',
              plug: 'input',
              group: 'Close Actions',
              name: 'closeAction-' + p,
              displayName: p
            });
          }
        }

        context.editorConnection.sendDynamicPorts(node.id, ports);
      }

      _updatePorts();
      node.on('parameterUpdated', function (event) {
        if (event.name === 'results' || event.name === 'closeActions') {
          _updatePorts();
        }
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.NavigationClosePopup', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('NavigationClosePopup')) {
        _managePortsForNode(node);
      }
    });
  }
};
