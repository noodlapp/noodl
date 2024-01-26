import React, { useEffect } from 'react';
import NoodlRuntime from '@noodl/runtime';

import ASyncQueue from '../../async-queue';
import guid from '../../guid';
import { createNodeFromReactComponent } from '../../react-component-node';
import { Noodl, Slot } from '../../types';
import { ComponentPageInfo, NavigateArgs, RouterHandler } from './router-handler';

export interface RouterReactComponentProps extends Noodl.ReactProps {
  didMount: () => void;
  willUnmount: () => void;

  children: Slot;
}

function RouterReactComponent(props: RouterReactComponentProps) {
  const { didMount, willUnmount, children, style } = props;

  useEffect(() => {
    didMount();
    return () => {
      willUnmount();
    };
  }, []);

  return (
    <div className={props.className} style={style}>
      {children}
    </div>
  );
}

function _trimUrlPart(url) {
  if (url[0] === '/') url = url.substring(1);
  if (url[url.length - 1] === '/') url = url.substring(0, url.length - 1);
  return url;
}

function getBaseUrlLength(url: string): number {
  // If the URL is a full URL, then we only want to get the pathname.
  // Otherwise we just return the url length which should be the pathname.
  if (!url.startsWith('/')) {
    try {
      // Lets say the baseUrl is:
      // "https://collar-zippy-overcome.sandbox.noodl.app/my-folder"
      // Then we want to remove "/my-folder" from the substring
      return new URL(url).pathname.length;
    } catch {
      /* noop */
    }
  }

  return url.length;
}

const RouterNode = {
  name: 'Router',
  displayNodeName: 'Page Router',
  category: 'Visuals',
  docs: 'https://docs.noodl.net/nodes/navigation/page-router',
  useVariants: false,
  connectionPanel: {
    groupPriority: ['General', 'Actions', 'Events', 'Mounted']
  },
  initialize: function () {
    this._internal.asyncQueue = new ASyncQueue();

    this.onScheduleReset = () => {
      this.scheduleReset();
    };

    this.props.didMount = () => {
      this._internal.isMounted = true;

      // SSR Support
      if (typeof window !== 'undefined') {
        // Listen to push state events and update stack
        if (window.history && window.history.pushState) {
          //this is event is manually sent on push, so covers both pop and push state
          window.addEventListener('popstate', this.onScheduleReset);
        } else {
          // Only hash support
          window.addEventListener('hashchange', this.onScheduleReset);
        }
      }

      this._registerRouter();
    };

    this.props.willUnmount = () => {
      this._internal.isMounted = false;

      window.removeEventListener('popstate', this.onScheduleReset);
      window.removeEventListener('hashchange', this.onScheduleReset);

      this._deregisterRouter();
    };

    this.props.layout = 'column';
  },
  getInspectInfo() {
    return this._internal.currentUrl;
  },
  defaultCss: {
    flex: '1 1',
    alignSelf: 'stretch',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  },
  getReactComponent() {
    return RouterReactComponent;
  },
  inputs: {
    name: {
      type: 'string',
      displayName: 'Name',
      group: 'General',
      set: function (value) {
        this._deregisterRouter();
        this._internal.name = value;

        if (this._internal.isMounted) {
          this._registerRouter();
        }
      }
    },
    pages: {
      type: { name: 'pages', allowEditOnly: true },
      displayName: 'Pages',
      group: 'Pages',
      set: function (value) {
        this._internal.pages = value;
        if (this._internal.isMounted) {
          this.scheduleReset();
        }
      }
    },
    urlPath: {
      type: 'string',
      displayName: 'Url path',
      group: 'General',
      set: function (value) {
        this._internal.urlPath = value;
      }
    },
    clip: {
      displayName: 'Clip Behavior',
      type: {
        name: 'enum',
        enums: [
          { value: 'contentHeight', label: 'Expand to content size' },
          { value: 'scroll', label: 'Scroll' },
          { value: 'clip', label: 'Clip content' }
        ]
      },
      group: 'Layout',
      default: 'contentHeight',
      set(value) {
        switch (value) {
          case 'scroll':
            this.setStyle({ overflow: 'auto' });
            break;
          case 'clip':
            this.setStyle({ overflow: 'hidden' });
            break;
          default:
            this.removeStyle(['overflow']);
            break;
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
    currentPageTitle: {
      type: 'string',
      group: 'General',
      displayName: 'Current Page Title',
      getter: function () {
        return this._internal.currentPage !== undefined ? this._internal.currentPage.title : undefined;
      }
    },
    currentPageComponent: {
      type: 'string',
      group: 'General',
      displayName: 'Current Page Component',
      getter: function () {
        return this._internal.currentPage !== undefined ? this._internal.currentPage.component : undefined;
      }
    }
  },
  methods: {
    _registerRouter() {
      RouterHandler.instance.registerRouter(this._internal.name, this);
    },
    _deregisterRouter() {
      RouterHandler.instance.deregisterRouter(this._internal.name, this);
    },
    setPageOutputs(outputs) {
      for (const prop in outputs) {
        this._internal[prop] = outputs[prop];
        this.flagOutputDirty(prop);
      }
    },
    scheduleReset() {
      const internal = this._internal;
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
    scrollToTop() {
      const dom = this.getDOMElement();
      if (dom) {
        dom.scrollTop = 0;

        if (NoodlRuntime.instance.getProjectSettings().bodyScroll) {
          //Automatically scroll the page router into view in case it's currently outside the viewport
          //Might want to add an option to disable this
          dom.scrollIntoView();
        }
      }
    },
    async resetAsync() {
      let component: string;
      let params = {};

      const matchFromUrl = this.matchPageFromUrl();
      if (matchFromUrl) {
        if (!matchFromUrl.page) {
          // Use the start page
          component = this._internal.pages !== undefined ? this._internal.pages.startPage : undefined;
          params = Object.assign({}, matchFromUrl.params, matchFromUrl.query);
        } else {
          // Use the matching page
          component = matchFromUrl.page.component;
          params = Object.assign({}, matchFromUrl.params, matchFromUrl.query);
        }
      } else {
        // TODO: Clean up matchPageFromUrl, in this case it returns undefined.
        //       remainingNavigationPath is undefined, since it have to run
        //       matchPageFromUrl to get the path. So it feels like it needs
        //       some bigger refactoring to make it understandable.
        component = this._internal.pages.startPage;
        params = {};
      }

      if (component === undefined) return; // No component specified for page

      const currentPage = RouterHandler.instance.getPageInfoForComponent(component);

      if (this._internal.currentPage === currentPage) {
        //already at the correct page, keep the current page
        //update page inputs if they have changed
        //TODO: fix if a parameter goes from a value to undefined, the old value will still exist in the connection from previous navigation
        if (!shallowObjectsEqual(this._internal.currentParams, params)) {
          this._internal.currentParams = params;
          this._updatePageInputs(this._internal.currentPageComponent.nodeScope, params);
        }
        return;
      }

      this.scrollToTop();

      // Reset the current page for this router
      // First remove all children
      const children = this.getChildren();
      for (const i in children) {
        const c = children[i];
        this.removeChild(c);
        this.nodeScope.deleteNode(c);
      }

      const content = await this.nodeScope.createNode(component, guid());
      this._internal.currentPageComponent = content;

      // Find the root page node
      const pageNodes = content.nodeScope.getNodesWithType('Page');
      if (pageNodes === undefined || pageNodes.length !== 1) {
        return; // Should be only one page root
      }

      this._internal.currentPage = RouterHandler.instance.getPageInfoForComponent(component);
      this._internal.currentParams = params;

      this.flagOutputDirty('currentPageTitle');
      this.flagOutputDirty('currentPageComponent');
      // @ts-expect-error Noodl is not defined
      Noodl.SEO.setTitle(this._internal.currentPage.title);

      this._updatePageInputs(this._internal.currentPageComponent.nodeScope, params);

      const group = this.createPageContainer();
      group.addChild(content);

      this.addChild(group);

      /*	this.setPageOutputs({
				currentUrl: pageInfo.path,
				currentTitle: pageInfo.title
			});*/
    },
    _updatePageInputs(nodeScope, params) {
      for (const pageInputNode of nodeScope.getNodesWithType('PageInputs')) {
        pageInputNode._setPageParams(params);
      }
    },
    getRelativeURL(targetPage: ComponentPageInfo, pageParams: NavigateArgs['params']) {
      if (!targetPage) return;

      let urlPath = targetPage.path;
      if (urlPath === undefined) return;

      // First add matching parameters to path
      const paramsInPath = urlPath.match(/{([^}]+)}/g);

      const params = Object.assign({}, pageParams);
      if (paramsInPath) {
        for (const param of paramsInPath) {
          const key = param.replace(/[{}]/g, '');
          if (pageParams[key] !== undefined) {
            urlPath = urlPath.replace(param, encodeURIComponent(params[key]));
            delete params[key];
          }
        }
      }

      // Add other paramters as query
      const query = [];
      for (const key in params) {
        query.push({
          name: key,
          value: encodeURIComponent(params[key])
        });
      }

      urlPath = _trimUrlPart(urlPath);

      // Prepend this routers url path if there is one
      if (this._internal.urlPath !== undefined) urlPath = _trimUrlPart(this._internal.urlPath) + '/' + urlPath;

      return {
        path: urlPath,
        query: query
      };
    },
    getNavigationAbsoluteURL(targetPage: ComponentPageInfo, pageParams: NavigateArgs['params']) {
      let parent = this.parent;
      let parentUrl = { path: '', query: [] };

      while (parent !== undefined && typeof parent.getNavigationAbsoluteURL !== 'function') {
        parent = parent.getVisualParentNode();
      }

      if (parent) {
        parentUrl = parent.getNavigationAbsoluteURL(parent._internal.currentPage, parent._internal.currentParams);
      }

      const thisUrl = this.getRelativeURL(targetPage, pageParams);
      if (thisUrl) {
        const haveForwardSlash = parentUrl.path.endsWith('/') || thisUrl.path.startsWith('/');
        return {
          path: parentUrl.path + (haveForwardSlash ? '' : '/') + thisUrl.path,
          query: parentUrl.query.concat(thisUrl.query)
        };
      }

      return parentUrl;
    },
    _getLocationPath: function () {
      const navigationPathType = NoodlRuntime.instance.getProjectSettings()['navigationPathType'];
      if (navigationPathType === undefined || navigationPathType === 'hash') {
        // Use hash as path
        let hash = location.hash;
        if (hash) {
          if (hash[0] === '#') hash = hash.substring(1);
          if (hash[0] === '/') hash = hash.substring(1);
        }
        return decodeURI(hash);
      } else {
        // Use url as path
        let path = location.pathname;
        if (path) {
          if (path[0] === '/') {
            // @ts-expect-error missing Noodl typings
            const baseUrl = Noodl.Env['BaseUrl'];
            if (baseUrl) {
              const pathnameLength = getBaseUrlLength(baseUrl);
              path = path.substring(pathnameLength);
            } else {
              path = path.substring(1);
            }
          }
        }
        return decodeURI(path);
      }
    },
    _getSearchParams: function () {
      // Regex for replacing addition symbol with a space
      const pl = /\+/g;
      const search = /([^&=]+)=?([^&]*)/g;
      const decode = function (s) {
        return decodeURIComponent(s.replace(pl, ' '));
      };
      const query = location.search.substring(1);

      let match: RegExpExecArray;

      const urlParams = {};
      while ((match = search.exec(query))) urlParams[decode(match[1])] = decode(match[2]);

      return urlParams;
    },
    getNavigationRemainingPath() {
      return this._internal.remainingNavigationPath;
    },
    matchPageFromUrl() {
      // Attempt to find relative path from closest navigation parent
      let parent = this.parent;
      while (parent !== undefined && typeof parent.getNavigationRemainingPath !== 'function') {
        parent = parent.getVisualParentNode();
      }

      let pathParts = undefined;

      // Either use current browser location if we have no parent, or use remaining path
      // from parent
      if (parent === undefined) {
        let urlPath = this._getLocationPath();
        if (urlPath[0] === '/') urlPath = urlPath.substring(1);
        pathParts = urlPath.split('/');
      } else {
        pathParts = parent.getNavigationRemainingPath();
      }
      if (pathParts === undefined) return;

      const urlQuery = this._getSearchParams();

      function _matchPathParts(path, pattern) {
        const params = {};
        for (let i = 0; i < pattern.length; i++) {
          const _p = pattern[i];
          if (_p[0] === '{' && _p[_p.length - 1] === '}') {
            // This is a param, collect it
            if (path[i] !== undefined) {
              params[_p.substring(1, _p.length - 1)] = decodeURIComponent(path[i]);
            }
          } else if (path[i] === undefined || _p !== path[i]) return;
        }
        return {
          params: params,
          remainingPathParts: path.slice().splice(pattern.length) // Make copy
        };
      }

      const pages = RouterHandler.instance.getPagesForRouter(this._internal.name);
      if (pages === undefined || pages.length === 0) return;

      let matchedPage,
        bestMatchLength = 9999;
      for (const pageInfo of pages) {
        let pagePattern = pageInfo.path;
        if (pagePattern === undefined) continue;
        pagePattern = _trimUrlPart(pagePattern);

        // Prepend this routers url path if there is one
        if (this._internal.urlPath !== undefined)
          pagePattern = _trimUrlPart(this._internal.urlPath) + '/' + pagePattern;

        const pagePatternParts = pagePattern.split('/');
        const match = _matchPathParts(pathParts, pagePatternParts);

        const dist = Math.abs(pagePatternParts.length - pathParts.length);
        if (match && bestMatchLength > dist) {
          // This page is a match
          matchedPage = { match, pageInfo };
          bestMatchLength = dist;
        }
      }

      if (matchedPage) {
        this._internal.remainingNavigationPath = matchedPage.match.remainingPathParts;
        return {
          page: matchedPage.pageInfo,
          params: matchedPage.match.params,
          query: urlQuery
        };
      } else {
        return {
          page: undefined, // no matched page
          params: {},
          query: urlQuery
        };
      }
    },
    _getCompleteUrlToPage(page: ComponentPageInfo, pageParams: NavigateArgs['params']) {
      const url = this.getNavigationAbsoluteURL(page, pageParams);

      let urlPath, hashPath;
      const navigationPathType = NoodlRuntime.instance.getProjectSettings()['navigationPathType'];
      if (navigationPathType === undefined || navigationPathType === 'hash') {
        hashPath = url.path;
      } else {
        urlPath = url.path;
      }

      const query = url.query.map((q) => q.name + '=' + q.value);
      const compiledUrl =
        (urlPath !== undefined ? urlPath : '') +
        (query.length >= 1 ? '?' + query.join('&') : '') +
        (hashPath !== undefined ? '#' + hashPath : '');

      return compiledUrl;
    },
    _updateUrlWithTopPage() {
      // Push the state to the browser url
      if (window.history !== undefined) {
        this._internal.remainingNavigationPath = undefined; // Reset remaining nav path

        const url = this._getCompleteUrlToPage(this._internal.currentPage, this._internal.currentParams);
        window.history.pushState({}, '', url);
      }
    },
    navigate(args) {
      this._internal.asyncQueue.enqueue(this.navigateAsync.bind(this, args));
    },
    async navigateAsync(args: NavigateArgs) {
      if (args.target === undefined) return;

      const newPage = RouterHandler.instance.getPageInfoForComponent(args.target);
      if (!newPage) return; //TODO: send error to editor, "invalid page component name"

      if (args.openInNewTab) {
        const url = this._getCompleteUrlToPage(newPage, args.params);
        window.open(url, '_blank');
        args.hasNavigated && args.hasNavigated();
      } else {
        await this._navigateInCurrentWindow(newPage, args);
      }
    },
    async _navigateInCurrentWindow(newPage: ComponentPageInfo, args: NavigateArgs) {
      this.scrollToTop();

      // Remove all current pages in the stack
      const children = this.getChildren();
      for (const i in children) {
        const c = children[i];
        this.removeChild(c);
        this.nodeScope.deleteNode(c);
      }

      const group = this.createPageContainer();

      // Create the page content
      const content = await this.nodeScope.createNode(args.target, guid());

      this._internal.currentPage = newPage;
      this._internal.currentParams = args.params;

      this.flagOutputDirty('currentPageTitle');
      this.flagOutputDirty('currentPageComponent');
      // @ts-expect-error Noodl is not defined
      Noodl.SEO.setTitle(this._internal.currentPage.title);

      const pageInputNodes = content.nodeScope.getNodesWithType('PageInputs');
      if (pageInputNodes !== undefined && pageInputNodes.length > 0) {
        pageInputNodes.forEach((node) => {
          node._setPageParams(args.params);
        });
      }

      group.addChild(content);
      this.addChild(group);

      this._updateUrlWithTopPage();

      args.hasNavigated && args.hasNavigated();
      RouterHandler.instance.onNavigated(this._internal.name, newPage);
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }
    }
  }
};

function shallowObjectsEqual(object1, object2) {
  const keys1 = Object.keys(object1 || {});
  const keys2 = Object.keys(object2 || {});

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every((key) => object1[key] === object2[key]);
}

export default createNodeFromReactComponent(RouterNode);
