import { ProjectModel } from '@noodl-models/projectmodel';
import { NodeGraphTraverser, TraverseNode } from '@noodl-utils/node-graph-traverser';

import { DynamicPageObject, PageObject, PageType } from '../build-context';
import { getPageTitle, getPageUrl, getPathVariables } from './pages-helper';

type DynamicPageRouteHash = {
  [id: string]: DynamicPageObject[];
};

type PageRouteObject = {
  /** The node id. */
  id: string;
  componentName: string;

  path: string;
  variables: { query: string; name: string }[];
};

class RouteNode {
  /** The title of the current page. */
  title: string;

  componentName: string;

  /** Router name, ex 'Main' */
  routerName: string | undefined;

  /** The current page node data. */
  current: PageRouteObject;

  /** The previous page/router node data. */
  previous: PageRouteObject[];

  constructor(args: {
    title: string;
    componentName: string;
    routerName: string;
    current: PageRouteObject;
    previous: PageRouteObject[];
  }) {
    this.title = args.title;
    this.componentName = args.componentName;
    this.routerName = args.routerName;
    this.current = args.current;
    this.previous = args.previous;
  }

  public _getExpanded(dynamicHash: DynamicPageRouteHash): PageObject[] {
    const previousUrl = this.previous.map((x) => x.path).join('/');

    // Create a pretty url with absolute path
    function createUrl(subpath: string): string {
      const fullPath = subpath.startsWith('/') ? previousUrl + subpath : previousUrl + '/' + subpath;
      return fullPath.startsWith('/') ? fullPath : '/' + fullPath;
    }

    const map = (routes: (PageObject & Partial<RouteNode>)[]): PageObject[] => {
      return routes.map((route) => ({
        kind: route.kind,
        componentName: this.componentName,
        title: route.title || this.title,
        path: createUrl(route.path || route.current?.path),
        meta: route.meta || {}
      }));
    };

    if (this.current.variables) {
      const dynamicRoutes = dynamicHash[this.current.id];
      if (Array.isArray(dynamicRoutes) && dynamicRoutes.length > 0) {
        return map(dynamicRoutes);
      }
    }

    return map([
      {
        kind: PageType.Static,
        componentName: this.componentName,
        title: this.title,
        path: this.current.path,
        meta: {}
      }
    ]);
  }
}

function getRoutePages(x: TraverseNode): PageRouteObject {
  const typename = x.node.typename;
  const urlPath = typename === 'Page' ? getPageUrl(x.node) : (x.node.parameters.urlPath as string);

  // Router can have no path, this will be ignored later.
  if (!urlPath) {
    return null;
  }

  // Get all the variables from the URL path
  const variables = getPathVariables(urlPath);

  // Read all the path variables from the page inputs node
  // NOTE: The tag might not always be there.
  // @ts-expect-error TODO: Solve tag type
  const pathParams = x.tag?.pageInputs?.parameters.pathParams;
  if (pathParams) {
    const pathParamsArray: string[] = pathParams.split(',');
    pathParamsArray.forEach((x) => {
      // Remove all the variables that are already added
      if (variables.findIndex((b) => b.name == x) !== -1) {
        return;
      }

      variables.push({
        query: `{${x}}`,
        name: x
      });
    });
  }

  const componentName = x.node.owner.owner.fullName; // node -> graph -> component

  return {
    id: x.node.id,
    componentName,
    path: urlPath,
    variables
  };
}

export interface IndexedPagesOptions {
  expandPaths?: (route: RouteNode) => Promise<Omit<DynamicPageObject, 'kind' | 'componentName'>[]>;
}

export async function getIndexedPages(
  project: ProjectModel,
  options: IndexedPagesOptions
): Promise<ReadonlyArray<PageObject>> {
  const { pages } = await getPageRoutes(project, options);
  return pages;
}

export async function getPageRoutes(project: ProjectModel, options: IndexedPagesOptions) {
  // Traverse the node grah looking for all the "Router" and "Page" nodes.
  const traverser = new NodeGraphTraverser(project, (node) => node.typename === 'Router' || node.typename === 'Page', {
    // Select the "Page Inputs" node which is used with a page.
    tagSelector: (node) => {
      if (node.typename === 'Page') {
        return {
          // @ts-ignore node.owner
          pageInputs: node.owner.roots.find((x) => x.typename === 'PageInputs'),
          // @ts-ignore node.owner
          componentName: node.owner.owner.name
        };
      }
      return null;
    }
  });

  // Fetch all the Page nodes.
  const pages: TraverseNode[] = traverser.filter((node) => node.node.typename === 'Page');

  // Create a RoutePath class for each possible route.
  const routes = pages.map((node) => {
    const title = getPageTitle(node.node);

    const parentsAndSelf = node.parents(traverser.selector).reverse();
    parentsAndSelf.push(node);

    // urlPath is the same on both Page and Router
    const routes: PageRouteObject[] = parentsAndSelf.map(getRoutePages).filter((x) => !!x);

    // Find the router this in placed inside.
    const parentRouters = node.parents((x) => x.typename === 'Router');
    const routerName = parentRouters.length > 0 ? parentRouters[0].node.parameters.name : undefined;

    return new RouteNode({
      title,
      // @ts-expect-error node.tag
      componentName: node.tag.componentName,
      routerName,
      current: routes[routes.length - 1],
      previous: routes.slice(0, routes.length - 1)
    });
  });

  // Ask the user for the dynamic routes.
  const dynamicHash: DynamicPageRouteHash = {};
  await Promise.all(
    routes.map((x) => {
      if (x.current.variables.length === 0) {
        return Promise.resolve<string[]>([]);
      } else if (!dynamicHash[x.current.id]) {
        return (async function () {
          const expandedPaths = options.expandPaths ? await options.expandPaths(x) : [x];
          dynamicHash[x.current.id] = expandedPaths.map((x) => ({
            kind: PageType.Dynamic,
            // This is filled in by _getExpanded later
            componentName: undefined,
            ...x
          }));
          return dynamicHash[x.current.id];
        })();
      } else {
        return Promise.resolve(dynamicHash[x.current.id]);
      }
    })
  );

  // Create the final list of pages.
  const indexedPages = routes.map((node) => node._getExpanded(dynamicHash)).flat();

  return { routes, pages: indexedPages, dynamicHash };
}
