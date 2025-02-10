import React from 'react';

import ASyncQueue from '../../async-queue';
import { createNodeFromReactComponent } from '../../react-component-node';

const { useEffect } = require('react');

const guid = require('../../guid');

const NavigationHandler = require('./navigation-handler');
const NoodlRuntime = require('@noodl/runtime');

const Transitions = require('./transitions');

function PageStackReactComponent(props) {
  const { didMount, willUnmount, style, children } = props;

  useEffect(() => {
    didMount();
    return () => {
      willUnmount();
    };
  }, []);

  return <div style={style}>{children}</div>;
}

const PageStack = {
  name: 'Page Stack',
  displayNodeName: 'Component Stack',
  category: 'Visuals',
  docs: 'https://docs.noodl.net/nodes/component-stack/component-stack-node',
  useVariants: false,
  initialize() {
    this._internal.stack = [];

    this._internal.topPageName = '';
    this._internal.stackDepth = 0;

    this._internal.pageInfo = {};

    this._internal.asyncQueue = new ASyncQueue();

    this.onScheduleReset = () => {
      this.scheduleReset();
    };

    this.props.didMount = () => {
      this._internal.isMounted = true;

      // Listen to push state events and update stack
      if (window.history && window.history.pushState) {
        //this is event is manually sent on push, so covers both pop and push state
        window.addEventListener('popstate', this.onScheduleReset);
      } else {
        // Only hash support
        window.addEventListener('hashchange', this.onScheduleReset);
      }

      this._registerPageStack();
    };

    this.props.willUnmount = () => {
      this._internal.isMounted = false;

      window.removeEventListener('popstate', this.onScheduleReset);
      window.removeEventListener('hashchange', this.onScheduleReset);

      this._deregisterPageStack();
    };
  },
  getInspectInfo() {
    if (this._internal.stack.length === 0) {
      return 'No active page';
    }

    const info = [{ type: 'text', value: 'Active Components:' }];

    return info.concat(
      this._internal.stack.map((p) => {
        const pageInfo = this._findPage(p.pageId);
        return {
          type: 'text',
          value: '- ' + pageInfo.label
        };
      })
    );
  },
  defaultCss: {
    width: '100%',
    flex: '1 1 100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  },
  getReactComponent() {
    return PageStackReactComponent;
  },
  inputs: {
    name: {
      type: { name: 'string', identifierOf: 'PackStack' },
      displayName: 'Name',
      group: 'General',
      default: 'Main',
      set: function (value) {
        this._deregisterPageStack();
        this._internal.name = value;

        if (this._internal.isMounted) {
          this._registerPageStack();
        }
      }
    },
    /*	startPage: {
			type: 'component',
			displayName: 'Start Page',
			group: 'General',
			set: function (value) {
				this._internal.startPage = value;
				this.scheduleReset();
			}
		},*/
    useRoutes: {
      type: 'boolean',
      displayName: 'Use Routes',
      group: 'General',
      default: false,
      set: function (value) {
        this._internal.useRoutes = !!value;
      }
    },
    clip: {
      displayName: 'Clip Content',
      type: 'boolean',
      group: 'Layout',
      default: true,
      set(value) {
        if (value) {
          this.setStyle({ overflow: 'hidden' });
        } else {
          this.removeStyle(['overflow']);
        }
      }
    },
    pages: {
      type: 'proplist',
      displayName: 'Components',
      group: 'Components',
      set: function (value) {
        this._internal.pages = value;
        if (this._internal.isMounted) {
          this.scheduleReset();
        }
      }
    },
    reset: {
      type: 'signal',
      displayName: 'Reset',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleReset();
      }
    }
  },
  inputCss: {
    backgroundColor: {
      type: 'color',
      displayName: 'Background Color',
      group: 'Style',
      default: 'transparent',
      applyDefault: false
    }
  },
  outputs: {
    topPageName: {
      type: 'string',
      displayName: 'Top Component Name',
      group: 'General',
      get() {
        return this._internal.topPageName;
      }
    },
    stackDepth: {
      type: 'number',
      displayName: 'Stack Depth',
      group: 'General',
      get() {
        return this._internal.stackDepth;
      }
    }
  },
  methods: {
    _registerPageStack() {
      NavigationHandler.instance.registerPageStack(this._internal.name, this);
    },
    _deregisterPageStack() {
      NavigationHandler.instance.deregisterPageStack(this._internal.name, this);
    },
    /**
     * @param {String} pageIdOrLabel
     */
    _findPage(pageIdOrLabel) {
      if (this._internal.pageInfo[pageIdOrLabel]) {
        const pageInfo = this._internal.pageInfo[pageIdOrLabel];
        const pageRef = this._internal.pages.find((x) => x.id === pageIdOrLabel);
        return {
          component: String(pageInfo.component),
          label: String(pageRef.label),
          id: String(pageIdOrLabel)
        };
      }

      const pageRef = this._internal.pages.find((x) => x.label === pageIdOrLabel);
      if (pageRef) {
        const pageInfo = this._internal.pageInfo[pageRef.id];
        return {
          component: String(pageInfo.component),
          label: String(pageRef.label),
          id: String(pageRef.id)
        };
      }

      return undefined;
    },
    setPageOutputs(outputs) {
      for (const prop in outputs) {
        this._internal[prop] = outputs[prop];
        this.flagOutputDirty(prop);
      }
    },
    scheduleReset() {
      var internal = this._internal;
      if (!internal.hasScheduledReset) {
        internal.hasScheduledReset = true;
        this.scheduleAfterInputsHaveUpdated(() => {
          internal.hasScheduledReset = false;
          this.reset();
        });
      }
    },
    createPageContainer() {
      const group = this.nodeScope.createPrimitiveNode('Group');
      group.setStyle({ flex: '1 0 100%' });
      return group;
    },
    reset() {
      this._internal.asyncQueue.enqueue(this.resetAsync.bind(this));
    },
    async resetAsync() {
      var children = this.getChildren();
      for (var i in children) {
        var c = children[i];
        this.removeChild(c);
        this.nodeScope.deleteNode(c);
      }

      if (this._internal.pages === undefined || this._internal.pages.length === 0) return;

      let startPageId;
      let params = {};

      var pageFromUrl = this.matchPageFromUrl();
      if (pageFromUrl !== undefined) {
        // We have an url matching a page, use that page as start page
        startPageId = pageFromUrl.pageId;

        params = Object.assign({}, pageFromUrl.query, pageFromUrl.params);
      } else {
        startPageId = this._internal.startPageId;
        if (startPageId === undefined) startPageId = this._internal.pages[0].id;
      }

      // Find the page by either ID or by Label
      const pageInfo = this._findPage(startPageId);
      if (pageInfo === undefined || pageInfo.component === undefined) {
        // No page was found
        return;
      }

      var content = await this.nodeScope.createNode(pageInfo.component, guid());

      for (var key in params) {
        content.setInputValue(key, params[key]);
      }

      const group = this.createPageContainer();
      group.addChild(content);

      this.addChild(group);
      this._internal.stack = [
        {
          from: null,
          page: group,
          pageId: startPageId,
          pageInfo: pageInfo,
          params: params,
          componentName: this._internal.startPage
        }
      ];

      this.setPageOutputs({
        topPageName: pageInfo.label,
        stackDepth: this._internal.stack.length
      });
    },
    getRelativeURL() {
      var top = this._internal.stack[this._internal.stack.length - 1];
      if (top === undefined) return;

      var urlPath = top.pageInfo.path;
      if (urlPath === undefined) {
        var pageItem = this._internal.pages.find((p) => p.id == top.pageId);
        if (pageItem === undefined) return;

        urlPath = pageItem.label.replace(/\s+/g, '-').toLowerCase();
      }

      // First add matching parameters to path
      var paramsInPath = urlPath.match(/{([^}]+)}/g);

      var params = Object.assign({}, top.params);
      if (paramsInPath) {
        for (var param of paramsInPath) {
          var key = param.replace(/[{}]/g, '');
          if (top.params[key] !== undefined) {
            urlPath = urlPath.replace(param, encodeURIComponent(params[key]));
            delete params[key];
          }
        }
      }

      // Add other paramters as query
      var query = [];
      for (var key in params) {
        query.push({
          name: key,
          value: params[key]
        });
      }

      if (urlPath.startsWith('/')) urlPath = urlPath.substring(1);

      return {
        path: urlPath,
        query: query
      };
    },
    getNavigationAbsoluteURL() {
      var parent = this.parent;

      while (parent !== undefined && typeof parent.getNavigationAbsoluteURL !== 'function') {
        parent = parent.getVisualParentNode();
      }

      if (parent === undefined) {
        var parentUrl = { path: '', query: [] };
      } else {
        var parentUrl = parent.getNavigationAbsoluteURL();
      }

      var thisUrl = this.getRelativeURL();
      if (thisUrl === undefined) return parentUrl;
      else {
        return {
          path: parentUrl.path + (parentUrl.path.endsWith('/') ? '' : '/') + thisUrl.path,
          query: parentUrl.query.concat(thisUrl.query)
        };
      }
    },
    _getLocationPath: function () {
      var navigationPathType = NoodlRuntime.instance.getProjectSettings()['navigationPathType'];
      if (navigationPathType === undefined || navigationPathType === 'hash') {
        // Use hash as path
        var hash = location.hash;
        if (hash) {
          if (hash[0] === '#') hash = hash.substring(1);
          if (hash[0] === '/') hash = hash.substring(1);
        }
        return hash;
      } else {
        // Use url as path
        var path = location.pathname;
        if (path) {
          if (path[0] === '/') path = path.substring(1);
        }
        return path;
      }
    },
    _getSearchParams: function () {
      var match,
        pl = /\+/g, // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) {
          return decodeURIComponent(s.replace(pl, ' '));
        },
        query = window.location.search.substring(1);

      var urlParams = {};
      while ((match = search.exec(query))) urlParams[decode(match[1])] = decode(match[2]);

      return urlParams;
    },
    getNavigationRemainingPath() {
      return this._internal.remainingNavigationPath;
    },
    matchPageFromUrl(url) {
      if (!this._internal.useRoutes) return;
      if (this._internal.pages === undefined || this._internal.pages.length === 0) return;

      // Attempt to find relative path from closest navigation parent
      var parent = this.parent;
      while (parent !== undefined && typeof parent.getNavigationRemainingPath !== 'function') {
        parent = parent.getVisualParentNode();
      }

      if (parent === undefined) {
        var urlPath = this._getLocationPath();
        if (urlPath[0] === '/') urlPath = urlPath.substring(1);
        var pathParts = urlPath.split('/');
      } else {
        var pathParts = parent.getNavigationRemainingPath();
      }
      if (pathParts === undefined) return;

      var urlQuery = this._getSearchParams();

      function _matchPathParts(path, pattern) {
        var params = {};
        for (var i = 0; i < pattern.length; i++) {
          if (path[i] === undefined) return;

          var _p = pattern[i];
          if (_p[0] === '{' && _p[_p.length - 1] === '}') {
            // This is a param, collect it
            params[_p.substring(1, _p.length - 1)] = decodeURIComponent(path[i]);
          } else if (_p !== path[i]) return;
        }
        return {
          params: params,
          remainingPathParts: path.splice(pattern.length)
        };
      }

      for (var page of this._internal.pages) {
        var pageInfo = this._internal.pageInfo[page.id];
        if (pageInfo === undefined) continue;

        var pagePattern = pageInfo.path;
        if (pagePattern === undefined) {
          pagePattern = page.label.replace(/\s+/g, '-').toLowerCase();
        }
        if (pagePattern[0] === '/') pagePattern = pagePattern.substring(1);

        let match = _matchPathParts(pathParts, pagePattern.split('/'));
        if (match) {
          // This page is a match
          this._internal.remainingNavigationPath = match.remainingPathParts;
          return {
            pageId: page.id,
            params: match.params,
            query: urlQuery
          };
        }
      }
    },
    _updateUrlWithTopPage() {
      // Push the state to the browser url
      if (this._internal.useRoutes && window.history !== undefined) {
        var url = this.getNavigationAbsoluteURL();

        var urlPath, hashPath;
        var navigationPathType = NoodlRuntime.instance.getProjectSettings()['navigationPathType'];
        if (navigationPathType === undefined || navigationPathType === 'hash') hashPath = url.path;
        else urlPath = url.path;

        var query = url.query.map((q) => q.name + '=' + q.value);
        var compiledUrl =
          (urlPath !== undefined ? urlPath : '') +
          (query.length >= 1 ? '?' + query.join('&') : '') +
          (hashPath !== undefined ? '#' + hashPath : '');

        this._internal.remainingNavigationPath = undefined; // Reset remaining nav path
        //	console.log(compiledUrl);
        window.history.pushState({}, '', compiledUrl);
      }
    },
    replace(args) {
      this._internal.asyncQueue.enqueue(this.replaceAsync.bind(this, args));
    },
    async replaceAsync(args) {
      if (this._internal.pages === undefined || this._internal.pages.length === 0) {
        return;
      }

      if (this._internal.isTransitioning) {
        return;
      }

      const pageId = args.target || this._internal.pages[0].id;

      // Find the page by either ID or by Label
      const pageInfo = this._findPage(pageId);
      if (pageInfo === undefined || pageInfo.component === undefined) {
        // No page was found
        return;
      }

      // Remove all current pages in the stack
      var children = this.getChildren();
      for (var i in children) {
        var c = children[i];
        this.removeChild(c);
        this.nodeScope.deleteNode(c);
      }

      const group = this.createPageContainer();

      // Create the page content
      const content = await this.nodeScope.createNode(pageInfo.component, guid());
      for (var key in args.params) {
        content.setInputValue(key, args.params[key]);
      }
      group.addChild(content);

      this.addChild(group);

      // Replace stack
      this._internal.stack = [
        {
          from: null,
          page: group,
          pageId: pageId,
          pageInfo: pageInfo,
          params: args.params,
          componentName: args.target
        }
      ];

      this.setPageOutputs({
        topPageName: pageInfo.label,
        stackDepth: this._internal.stack.length
      });

      this._updateUrlWithTopPage();

      args.hasNavigated && args.hasNavigated();
    },
    navigate(args) {
      this._internal.asyncQueue.enqueue(this.navigateAsync.bind(this, args));
    },
    async navigateAsync(args) {
      if (this._internal.pages === undefined || this._internal.pages.length === 0) {
        return;
      }

      if (this._internal.isTransitioning) {
        return;
      }

      const pageId = args.target || this._internal.pages[0].id;

      // Find the page by either ID or by Label
      const pageInfo = this._findPage(pageId);
      if (pageInfo === undefined || pageInfo.component === undefined) {
        // No page was found
        return;
      }

      // Create the container group
      const group = this.createPageContainer();
      group.setInputValue('position', 'absolute');

      // Create the page content
      const content = await this.nodeScope.createNode(pageInfo.component, guid());
      for (var key in args.params) {
        content.setInputValue(key, args.params[key]);
      }
      group.addChild(content);

      // Connect navigate back nodes
      const navigateBackNodes = content.nodeScope.getNodesWithType('PageStackNavigateBack');
      if (navigateBackNodes && navigateBackNodes.length > 0) {
        for (var j = 0; j < navigateBackNodes.length; j++) {
          navigateBackNodes[j]._setBackCallback(this.back.bind(this));
        }
      }

      // Push the new top
      const top = this._internal.stack[this._internal.stack.length - 1];
      const newTop = {
        from: top.page,
        page: group,
        pageInfo: pageInfo,
        pageId: pageId,
        params: args.params,
        transition: new Transitions[args.transition.type || 'Push'](top.page, group, args.transition),
        backCallback: args.backCallback,
        componentName: args.target
      };
      this._internal.stack.push(newTop);
      this.setPageOutputs({
        topPageName: pageInfo.label,
        stackDepth: this._internal.stack.length
      });
      this._updateUrlWithTopPage();

      newTop.transition.forward(0);

      this._internal.isTransitioning = true;
      newTop.transition.start({
        end: () => {
          this._internal.isTransitioning = false;

          // Transition has completed, remove the previous top from the stack
          this.removeChild(top.page);
          group.setInputValue('position', 'relative');
        }
      });

      this.addChild(group);

      args.hasNavigated && args.hasNavigated();
    },
    back(args) {
      if (this._internal.stack.length <= 1) return;
      if (this._internal.isTransitioning) return;

      var top = this._internal.stack[this._internal.stack.length - 1];

      top.page.setInputValue('position', 'absolute');
      // Insert the destination in the stack again
      this.addChild(top.from, 0);
      top.backCallback && top.backCallback(args.backAction, args.results);

      // Find the page by either ID or by Label
      const pageInfo = this._findPage(this._internal.stack[this._internal.stack.length - 2].pageId);

      this.setPageOutputs({
        topPageName: pageInfo.label,
        stackDepth: this._internal.stack.length - 1
      });

      this._internal.isTransitioning = true;
      top.transition.start({
        end: () => {
          this._internal.isTransitioning = false;

          top.page.setInputValue('position', 'relative');
          this.removeChild(top.page);
          this.nodeScope.deleteNode(top.page);
          this._internal.stack.pop();

          this._updateUrlWithTopPage();
        },
        back: true
      });
    },
    setPageComponent(pageId, component) {
      var internal = this._internal;
      if (!internal.pageInfo[pageId]) internal.pageInfo[pageId] = {};
      internal.pageInfo[pageId].component = component;

      // this.scheduleRefresh();
    },
    setPagePath(pageId, path) {
      var internal = this._internal;
      if (!internal.pageInfo[pageId]) internal.pageInfo[pageId] = {};
      internal.pageInfo[pageId].path = path;

      //  this.scheduleRefresh();
    },
    setStartPage(pageId) {
      this._internal.startPageId = pageId;
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name.startsWith('pageComp-'))
        return this.registerInput(name, {
          set: this.setPageComponent.bind(this, name.substring('pageComp-'.length))
        });

      if (name.startsWith('pagePath-'))
        return this.registerInput(name, {
          set: this.setPagePath.bind(this, name.substring('pagePath-'.length))
        });

      if (name === 'startPage')
        return this.registerInput(name, {
          set: this.setStartPage.bind(this)
        });
    }
  },
  setup(context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      function _updatePorts() {
        var ports = [];

        if (node.parameters['pages'] !== undefined && node.parameters['pages'].length > 0) {
          node.parameters['pages'].forEach((p) => {
            // Component for page
            ports.push({
              name: 'pageComp-' + p.id,
              displayName: 'Component',
              editorName: p.label + ' | Component',
              plug: 'input',
              type: 'component',
              parent: 'pages',
              parentItemId: p.id
            });

            // Path for page
            if (node.parameters['useRoutes'] === true) {
              ports.push({
                name: 'pagePath-' + p.id,
                displayName: 'Path',
                editorName: p.label + ' | Path',
                plug: 'input',
                type: 'string',
                default: p.label.replace(/\s+/g, '-').toLowerCase(),
                parent: 'pages',
                parentItemId: p.id
              });
            }
          });

          ports.push({
            plug: 'input',
            type: {
              name: 'enum',
              enums: node.parameters['pages'].map((p) => ({
                label: p.label,
                value: p.id
              })),
              allowEditOnly: true
            },
            group: 'General',
            displayName: 'Start Page',
            name: 'startPage',
            default: node.parameters['pages'][0].id
          });
        }

        context.editorConnection.sendDynamicPorts(node.id, ports);
      }

      _updatePorts();
      node.on('parameterUpdated', function (ev) {
        if (ev.name === 'pages' || ev.name === 'useRoutes') _updatePorts();
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.Page Stack', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('Page Stack')) {
        _managePortsForNode(node);
      }
    });
  }
};

export default createNodeFromReactComponent(PageStack);
