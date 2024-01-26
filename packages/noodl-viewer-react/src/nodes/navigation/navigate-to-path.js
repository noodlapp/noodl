'use strict';

const NoodlRuntime = require('@noodl/runtime');

const NavigateToPathNode = {
  name: 'PageStackNavigateToPath',
  displayNodeName: 'Navigate To Path',
  category: 'Navigation',
  docs: 'https://docs.noodl.net/nodes/navigation/navigate-to-path',
  initialize() {
    const internal = this._internal;
    internal.params = {};
    internal.query = {};
    internal.openInNewTab = false;
  },
  inputs: {
    path: {
      type: { name: 'string' },
      displayName: 'Path',
      group: 'General',
      set(value) {
        this._internal.path = value;
      }
    },
    queryNames: {
      type: { name: 'stringlist', allowEditOnly: true },
      displayName: 'Query',
      group: 'Query',
      set(value) {
        this._internal.queryNames = value;
      }
    },
    openInNewTab: {
      index: 10,
      displayName: 'Open in new tab',
      group: 'General',
      default: false,
      type: 'boolean',
      set(value) {
        this._internal.openInNewTab = !!value;
      }
    },
    navigate: {
      displayName: 'Navigate',
      group: 'Actions',
      valueChangedToTrue() {
        this.scheduleNavigate();
      }
    }
  },
  outputs: {},
  methods: {
    scheduleNavigate() {
      var internal = this._internal;

      if (!internal.hasScheduledNavigate) {
        internal.hasScheduledNavigate = true;
        this.scheduleAfterInputsHaveUpdated(() => {
          internal.hasScheduledNavigate = false;
          this.navigate();
        });
      }
    },
    navigate() {
      var internal = this._internal;

      var formattedPath = internal.path;
      if (formattedPath === undefined) return;

      var matches = internal.path.match(/\{[A-Za-z0-9_]*\}/g);
      var inputs = [];
      if (matches) {
        inputs = matches.map(function (name) {
          return name.replace('{', '').replace('}', '');
        });
      }

      inputs.forEach(function (name) {
        var v = internal.params[name];
        formattedPath = formattedPath.replace('{' + name + '}', v !== undefined ? v : '');
      });

      var urlPath, hashPath;
      var navigationPathType = NoodlRuntime.instance.getProjectSettings()['navigationPathType'];
      if (navigationPathType === undefined || navigationPathType === 'hash') hashPath = formattedPath;
      else urlPath = formattedPath;

      var query = [];
      if (internal.queryNames !== undefined) {
        internal.queryNames.split(',').forEach((q) => {
          if (internal.query[q] !== undefined) {
            query.push(q + '=' + internal.query[q]);
          }
        });
      }

      var compiledUrl =
        (urlPath !== undefined ? urlPath : '') +
        (query.length >= 1 ? '?' + query.join('&') : '') +
        (hashPath !== undefined ? '#' + hashPath : '');

      if (this._internal.openInNewTab) {
        window.open(compiledUrl, '_blank');
      } else {
        window.history.pushState({}, '', compiledUrl);
        dispatchEvent(new PopStateEvent('popstate', {}));
      }
    },
    setParam(name, value) {
      this._internal.params[name] = value;
    },
    setQuery(name, value) {
      this._internal.query[name] = value;
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('p-'))
        return this.registerInput(name, {
          set: this.setParam.bind(this, name.substring('p-'.length))
        });

      if (name.startsWith('q-'))
        return this.registerInput(name, {
          set: this.setQuery.bind(this, name.substring('q-'.length))
        });
    }
  }
};

module.exports = {
  node: NavigateToPathNode,
  setup: function setup(context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      function _updatePorts() {
        var ports = [];

        if (node.parameters['path'] !== undefined) {
          var inputs = node.parameters['path'].match(/\{[A-Za-z0-9_]*\}/g) || [];
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
                name: 'p-' + name,
                displayName: name,
                group: 'Parameter',
                type: '*',
                plug: 'input'
              };
            });
        }

        if (node.parameters['queryNames'] !== undefined) {
          node.parameters['queryNames'].split(',').forEach((q) => {
            ports.push({
              name: 'q-' + q,
              displayName: q,
              group: 'Query',
              plug: 'input',
              type: '*'
            });
          });
        }

        context.editorConnection.sendDynamicPorts(node.id, ports);
      }

      _updatePorts();
      node.on('parameterUpdated', function (event) {
        _updatePorts();
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.PageStackNavigateToPath', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('PageStackNavigateToPath')) {
        _managePortsForNode(node);
      }
    });
  }
};
