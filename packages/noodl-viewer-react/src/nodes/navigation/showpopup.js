const ShowPopupNode = {
  name: 'NavigationShowPopup',
  displayNodeName: 'Show Popup',
  category: 'Navigation',
  docs: 'https://docs.noodl.net/nodes/popups/show-popup',
  initialize: function () {
    this._internal.popupParams = {};
    this._internal.closeResults = {};
  },
  inputs: {
    target: {
      type: 'component',
      displayName: 'Target',
      group: 'General',
      set: function (value) {
        this._internal.target = value;
      }
    },
    show: {
      type: 'signal',
      displayName: 'Show',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleShow();
      }
    }
  },
  outputs: {
    Closed: {
      type: 'signal'
    }
  },
  methods: {
    setPopupParam: function (param, value) {
      this._internal.popupParams[param] = value;
    },
    getCloseResult: function (param) {
      return this._internal.closeResults[param];
    },
    scheduleShow: function () {
      var _this = this;
      var internal = this._internal;
      if (!internal.hasScheduledShow) {
        internal.hasScheduledShow = true;
        this.scheduleAfterInputsHaveUpdated(function () {
          internal.hasScheduledShow = false;
          _this.show();
        });
      }
    },
    show: function () {
      if (this._internal.target == undefined) return;

      this.context.showPopup(this._internal.target, this._internal.popupParams, {
        senderNode: this.nodeScope.componentOwner,
        /**
         * @param {string | undefined} action
         * @param {*} results
         */
        onClosePopup: (action, results) => {
          this._internal.closeResults = results;

          for (const key in results) {
            if (this.hasOutput('closeResult-' + key)) {
              this.flagOutputDirty('closeResult-' + key);
            }
          }

          if (!action) {
            this.sendSignalOnOutput('Closed');
          } else {
            this.sendSignalOnOutput(action);
          }
        }
      });
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('popupParam-'))
        return this.registerInput(name, {
          set: this.setPopupParam.bind(this, name.substring('popupParam-'.length))
        });
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name.startsWith('closeResult-'))
        return this.registerOutput(name, {
          getter: this.getCloseResult.bind(this, name.substring('closeResult-'.length))
        });

      if (name.startsWith('closeAction-'))
        return this.registerOutput(name, {
          getter: function () {
            /** No needed for signals */
          }
        });
    }
  }
};

module.exports = {
  node: ShowPopupNode,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      function _updatePorts() {
        var ports = [];

        var targetComponentName = node.parameters['target'];
        if (targetComponentName !== undefined) {
          var c = graphModel.components[targetComponentName];
          if (c) {
            for (var inputName in c.inputPorts) {
              var o = c.inputPorts[inputName];
              ports.push({
                name: 'popupParam-' + inputName,
                displayName: inputName,
                type: o.type || '*',
                plug: 'input',
                group: 'Params'
              });
            }

            for (const _n of c.getNodesWithType('NavigationClosePopup')) {
              if (_n.parameters['closeActions'] !== undefined) {
                _n.parameters['closeActions'].split(',').forEach((a) => {
                  if (ports.find((p) => p.name === a)) return;

                  ports.push({
                    name: 'closeAction-' + a,
                    displayName: a,
                    type: 'signal',
                    plug: 'output',
                    group: 'Close Actions'
                  });
                });
              }

              if (_n.parameters['results'] !== undefined) {
                _n.parameters['results'].split(',').forEach((p) => {
                  ports.push({
                    name: 'closeResult-' + p,
                    displayName: p,
                    type: '*',
                    plug: 'output',
                    group: 'Close Results'
                  });
                });
              }
            }
          }
        }
        context.editorConnection.sendDynamicPorts(node.id, ports);
      }

      function _trackTargetComponent(name) {
        if (name === undefined) return;
        var c = graphModel.components[name];
        if (c === undefined) return;

        c.on('inputPortAdded', _updatePorts);
        c.on('inputPortRemoved', _updatePorts);

        // Also track all close popups for changes
        for (const _n of c.getNodesWithType('NavigationClosePopup')) {
          _n.on('parameterUpdated', _updatePorts);
        }

        // Track close popup added and removed
        c.on('nodeAdded', (_n) => {
          if (_n.type === 'NavigationClosePopup') {
            _n.on('parameterUpdated', _updatePorts);
            _updatePorts();
          }
        });

        c.on('nodeWasRemoved', (_n) => {
          if (_n.type === 'NavigationClosePopup') _updatePorts();
        });
      }

      _updatePorts();
      _trackTargetComponent(node.parameters['target']);

      // Track parameter updated
      node.on('parameterUpdated', function (event) {
        if (event.name === 'target') {
          _updatePorts();
          _trackTargetComponent(node.parameters['target']);
        }
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.NavigationShowPopup', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('NavigationShowPopup')) {
        _managePortsForNode(node);
      }
    });
  }
};
