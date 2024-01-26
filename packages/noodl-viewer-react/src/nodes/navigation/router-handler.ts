import NoodlRuntime from '@noodl/runtime';

import type { NodeConstructor } from '../../../typings/global';

export type NavigateArgs = {
  target: string;
  params: Record<string, string | number | boolean>;
  openInNewTab?: boolean;
  hasNavigated: () => void;
};

export type ComponentPageInfo = {
  path: string;
  title: string;
  component: string;
};

export class RouterHandler {
  static instance = new RouterHandler();

  _routers: Record<string, any>;
  _navigationQueue: any[];

  constructor() {
    this._routers = {};
    this._navigationQueue = [];
  }

  navigate(name: string, args: NavigateArgs) {
    //add a 1ms timeout so other nodes have a chance to run before the page is destroyed.
    setTimeout(() => {
      const routerNames = Object.keys(this._routers);
      if (routerNames.length === 1) {
        name = routerNames[0];
      }

      if (this._routers[name]) {
        for (const router of this._routers[name]) {
          router.navigate(args);
        }
      } else {
        this._navigationQueue.push({ name, args });
      }
    }, 1);
  }

  registerRouter(name: string, router: NodeConstructor) {
    name = name || 'Main';
    if (!this._routers[name]) {
      this._routers[name] = [];
    }

    this._routers[name].push(router);

    let hasNavigated = false;

    let i = 0;
    while (i < this._navigationQueue.length) {
      const e = this._navigationQueue[i];
      if (e.name === name) {
        router.navigate(e.args);
        hasNavigated = true;
        this._navigationQueue.splice(i, 1);
      } else {
        i++;
      }
    }

    if (!hasNavigated) {
      router.reset(); //no navigation has happened, call reset() so the start page is created
    }
  }

  deregisterRouter(name: string, router: NodeConstructor) {
    name = name || 'Main';

    if (!this._routers[name]) {
      return;
    }

    const index = this._routers[name].indexOf(router);
    if (index === -1) {
      return;
    }

    this._routers[name].splice(index, 1);
    if (this._routers[name].length === 0) {
      delete this._routers[name];
    }
  }

  getPagesForRouter(name) {
    const routerIndex = NoodlRuntime.instance.graphModel.routerIndex;
    const routers = routerIndex.routers;

    if (routers === undefined || routers.length === 0) return [];

    const matchingRouters = name === undefined ? [routers[0]] : routers.filter((r) => r.name === name);

    const pageComponents = new Set();
    matchingRouters.forEach((r) => {
      const pages = r.pages;
      if (pages !== undefined && pages.routes !== undefined) {
        pages.routes.forEach((r) => {
          pageComponents.add(r);
        });
      }
    });

    return Array.from(pageComponents)
      .map((c) => this.getPageInfoForComponent(String(c)))
      .filter((item) => !!item);
  }

  getPageInfoForComponent(componentName: string): ComponentPageInfo | undefined {
    const routerIndex = NoodlRuntime.instance.graphModel.routerIndex;
    const page = routerIndex.pages.find((p) => p.component === componentName);
    return page;
  }

  /**
   * Occurs when the Router navigates to a new page.
   *
   * @param routerName
   * @param page
   */
  onNavigated(routerName: string, page: ComponentPageInfo) {
    // @ts-expect-error window.Noodl is not defined
    window.Noodl.Events.emit('NoodlApp_Navigated', {
      routerName,
      ...page
    });
  }
}
