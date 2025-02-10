const Transitions = require('./transitions');
const NavigationHandler = require('./navigation-handler');

const Navigate = {
  name: 'PageStackNavigate',
  displayNodeName: 'Push Component To Stack',
  category: 'Navigation',
  docs: 'https://docs.noodl.net/nodes/component-stack/push-component',
  initialize: function () {
    this._internal.transitionParams = {};
    this._internal.pageParams = {};
    this._internal.backResults = {};
  },
  inputs: {
    stack: {
      type: { name: 'string', identifierOf: 'PackStack' },
      displayName: 'Stack',
      group: 'General',
      default: 'Main',
      set: function (value) {
        this._internal.stack = value;
      }
    },
    mode: {
      type: {
        name: 'enum',
        enums: [
          { label: 'Push', value: 'push' },
          { label: 'Replace', value: 'replace' }
        ]
      },
      displayName: 'Mode',
      default: 'push',
      group: 'General',
      set: function (value) {
        this._internal.navigationMode = value;
      }
    },
    navigate: {
      displayName: 'Navigate',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleNavigate();
      }
    }
  },
  outputs: {
    navigated: {
      type: 'signal',
      displayName: 'Navigated',
      group: 'Events'
    }
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
    navigate() {
      if (this._internal.navigationMode === 'push' || this._internal.navigationMode === undefined) {
        NavigationHandler.instance.navigate(this._internal.stack, {
          target: this._internal.target,
          transition: { ...{ type: this._internal.transition }, ...this._internal.transitionParams },
          params: this._internal.pageParams,
          backCallback: (action, results) => {
            this._internal.backResults = results;

            for (const key in results) {
              if (this.hasOutput('backResult-' + key)) {
                this.flagOutputDirty('backResult-' + key);
              }
            }

            if (action !== undefined) this.sendSignalOnOutput(action);
          },
          hasNavigated: () => {
            this.sendSignalOnOutput('navigated');
          }
        });
      } else if (this._internal.navigationMode === 'replace') {
        NavigationHandler.instance.replace(this._internal.stack, {
          target: this._internal.target,
          params: this._internal.pageParams,
          hasNavigated: () => {
            this.scheduleAfterInputsHaveUpdated(() => {
              this.sendSignalOnOutput('navigated');
            });
          }
        });
      }
    },
    setTransitionParam: function (param, value) {
      this._internal.transitionParams[param] = value;
    },
    setPageParam: function (param, value) {
      this._internal.pageParams[param] = value;
    },
    getBackResult: function (param, value) {
      return this._internal.backResults[param];
    },
    setTargetPageId: function (pageId) {
      this._internal.target = pageId;
    },
    setTransition: function (value) {
      this._internal.transition = value;
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name === 'target') {
        return this.registerInput(name, {
          set: this.setTargetPageId.bind(this)
        });
      } else if (name === 'transition') {
        return this.registerInput(name, {
          set: this.setTransition.bind(this)
        });
      } else if (name.startsWith('tr-')) {
        return this.registerInput(name, {
          set: this.setTransitionParam.bind(this, name.substring('tr-'.length))
        });
      } else if (name.startsWith('pm-')) {
        return this.registerInput(name, {
          set: this.setPageParam.bind(this, name.substring('pm-'.length))
        });
      }
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name.startsWith('backResult-'))
        return this.registerOutput(name, {
          getter: this.getBackResult.bind(this, name.substring('backResult-'.length))
        });
      else if (name.startsWith('backAction-'))
        return this.registerOutput(name, {
          getter: function () {
            /** No needed for signals */
          }
        });
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

      // Only push mode have transition
      if (node.parameters['mode'] === 'push' || node.parameters['mode'] === undefined) {
        ports.push({
          name: 'transition',
          plug: 'input',
          type: { name: 'enum', enums: Object.keys(Transitions) },
          default: 'Push',
          displayName: 'Transition',
          group: 'Transition'
        });

        var transition = node.parameters['transition'] || 'Push';
        if (Transitions[transition]) ports = ports.concat(Transitions[transition].ports(node.parameters));
      }

      const pageStacks = graphModel.getNodesWithType('Page Stack');
      const pageStack = pageStacks.find(
        (ps) => (ps.parameters['name'] || 'Main') === (node.parameters['stack'] || 'Main')
      );

      if (pageStack !== undefined) {
        const pages = pageStack.parameters['pages'];
        if (pages !== undefined && pages.length > 0) {
          ports.push({
            plug: 'input',
            type: {
              name: 'enum',
              enums: pages.map((p) => ({
                label: p.label,
                value: p.id
              }))
            },
            group: 'General',
            displayName: 'Target Page',
            name: 'target',
            default: pages[0].id
          });

          // See if there is a target page with component
          const targetPageId = node.parameters['target'] || pages[0].id;
          const targetComponentName = pageStack.parameters['pageComp-' + targetPageId];
          if (targetComponentName !== undefined) {
            const component = graphModel.components[targetComponentName];

            if (component !== undefined) {
              // Make all inputs of the component to inputs of this navigation node
              for (const inputName in component.inputPorts) {
                ports.push({
                  name: 'pm-' + inputName,
                  displayName: inputName,
                  type: '*',
                  plug: 'input',
                  group: 'Parameters'
                });
              }

              // Find all navigate back nodes and compile the back actions as
              // outputs of this node
              for (const backNode of component.getNodesWithType('PageStackNavigateBack')) {
                if (backNode.parameters['backActions'] !== undefined) {
                  backNode.parameters['backActions'].split(',').forEach((a) => {
                    if (ports.find((_p) => _p.name === 'backAction-' + a)) return;

                    ports.push({
                      name: 'backAction-' + a,
                      displayName: a,
                      type: 'signal',
                      plug: 'output',
                      group: 'Back Actions'
                    });
                  });
                }

                if (backNode.parameters['results']) {
                  backNode.parameters['results'].split(',').forEach((p) => {
                    if (ports.find((_p) => _p.name === 'backResult-' + p)) return;

                    ports.push({
                      name: 'backResult-' + p,
                      displayName: p,
                      type: '*',
                      plug: 'output',
                      group: 'Back Results'
                    });
                  });
                }
              }
            }
          }
        }
      }

      context.editorConnection.sendDynamicPorts(node.id, ports);
    }

    function _trackTargetComponent() {
      var pageStacks = graphModel.getNodesWithType('Page Stack');
      var pageStack = pageStacks.find((ps) => ps.parameters['name'] === node.parameters['stack']);
      if (pageStack === undefined) return;

      var pages = pageStack.parameters['pages'];
      if (pages === undefined || pages.length === 0) return;

      var targetCompoment = pageStack.parameters['pageComp-' + (node.parameters['target'] || pages[0].id)];
      if (targetCompoment === undefined) return;
      var c = graphModel.components[targetCompoment];
      if (c === undefined) return;

      c.on('inputPortAdded', _updatePorts);
      c.on('inputPortRemoved', _updatePorts);

      // Also track all back navigate for changes
      for (const _n of c.getNodesWithType('PageStackNavigateBack')) {
        _n.on('parameterUpdated', _updatePorts);
      }

      // Track back navigate added and removed
      c.on('nodeAdded', (_n) => {
        if (_n.type === 'PageStackNavigateBack') {
          _n.on('parameterUpdated', _updatePorts);
          _updatePorts();
        }
      });

      c.on('nodeWasRemoved', (_n) => {
        if (_n.type === 'PageStackNavigateBack') _updatePorts();
      });
    }

    _updatePorts();
    _trackTargetComponent();
    node.on('parameterUpdated', function (ev) {
      if (ev.name === 'target') {
        _trackTargetComponent();
        _updatePorts();
      } else if (ev.name === 'stack' || ev.name === 'mode' || ev.name === 'transition' || ev.name.startsWith('tr-')) _updatePorts();
    });

    // Track all page stacks for changes (if there are any changes to the pages of the name of a stack we might have to update)
    function _trackPageStack(node) {
      node.on('parameterUpdated', function (ev) {
        if (ev.name === 'pages' || ev.name === 'name') _updatePorts();
      });
    }
    graphModel.on('nodeAdded.Page Stack', _trackPageStack);
    graphModel.on('nodeWasRemoved.Page Stack', _updatePorts);

    for (const node of graphModel.getNodesWithType('Page Stack')) {
      _trackPageStack(node);
    }
  }

  graphModel.on('editorImportComplete', () => {
    graphModel.on('nodeAdded.PageStackNavigate', function (node) {
      _managePortsForNode(node);
    });

    for (const node of graphModel.getNodesWithType('PageStackNavigate')) {
      _managePortsForNode(node);
    }
  });
}

module.exports = {
  node: Navigate,
  setup: setup
};
