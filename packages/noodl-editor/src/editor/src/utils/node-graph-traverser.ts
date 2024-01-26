import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { ProjectModel } from '@noodl-models/projectmodel';

export interface NodeGraphTraverserOptions {
  /** Default: true */
  traverseRouter?: boolean;

  /** Default: false */
  traverseComponentStacks?: boolean;

  /** Default: true */
  traverseComponent?: boolean;

  tagSelector?: (node: NodeGraphNode) => unknown;
}

/**
 * NodeGraphTraverser is a class that can be used to traverse a graph of nodes.
 *
 * @example
 * ```typescript
 * // This will traverse all the nodes in the project and branch on the router nodes.
 * const traverser = new NodeGraphTraverser(project, node => node.type === 'Router');
 * ```
 *
 * @example
 * ```typescript
 * // This will traverse all the nodes in the project and branch on the page nodes.
 * //
 * // It will also find all the Page Input nodes relative to
 * // the pages and add them as tags to the node.
 * //
 * // This makes it easy to handle paired nodes.
 * const traverser = new NodeGraphTraverser(project, node => node.type === 'Page', {
 *   tagSelector: node => node.owner.roots.find((x) => x.typename === 'PageInputs')
 * });
 * ```
 */
export class NodeGraphTraverser {
  public readonly root: TraverseNode;

  public readonly traverseRouter: boolean;
  public readonly traverseComponentStacks: boolean;
  public readonly traverseComponent: boolean;
  public readonly tagSelector: NodeGraphTraverserOptions['tagSelector'] | null;

  public readonly visitedNodeIds: string[] = [];

  constructor(
    public readonly project: ProjectModel,
    public readonly selector: (node: NodeGraphNode) => boolean,
    options: NodeGraphTraverserOptions = {},
    targetNode: NodeGraphNode = undefined
  ) {
    this.traverseRouter = typeof options.traverseRouter === 'boolean' ? options.traverseRouter : true;
    this.traverseComponentStacks =
      typeof options.traverseComponentStacks === 'boolean' ? options.traverseComponentStacks : false;
    this.traverseComponent = typeof options.traverseComponent === 'boolean' ? options.traverseComponent : true;
    this.tagSelector = typeof options.tagSelector === 'function' ? options.tagSelector : null;

    this.root = new TraverseNode(this, null, targetNode || project.getRootNode(), null);
  }

  public forEach(callback: (node: TraverseNode) => void) {
    this.root.forEach(callback);
  }

  public map<T = any>(callback: (node: TraverseNode) => T) {
    const items: T[] = [];
    this.forEach((node) => {
      const result = callback(node);
      if (result) items.push(result);
    });
    return items;
  }

  public filter(callback: (node: TraverseNode) => boolean) {
    const items: TraverseNode[] = [];
    this.forEach((node) => {
      if (callback(node)) items.push(node);
    });
    return items;
  }
}

export class TraverseNode {
  private children: TraverseNode[] = [];

  constructor(
    public readonly root: NodeGraphTraverser,
    public readonly parent: TraverseNode | null,
    public readonly node: NodeGraphNode,
    public readonly tag: unknown
  ) {
    this.traverse(node);
  }

  public forEach(callback: (node: TraverseNode) => void) {
    callback(this);
    this.children.forEach((child) => {
      child.forEach(callback);
    });
  }

  public parents(filter?: (node: NodeGraphNode) => boolean): TraverseNode[] {
    const parents: TraverseNode[] = [];

    function traverse(parent) {
      if (parent.parent) {
        if (filter) {
          if (filter(parent.parent.node)) {
            parents.push(parent.parent);
          }
        } else {
          parents.push(parent.parent);
        }
        traverse(parent.parent);
      }
    }

    if (this.parent) {
      parents.push(this.parent);
      traverse(this.parent);
    }

    return parents;
  }

  private traverse(node: NodeGraphNode) {
    const nodeId = node.id;
    const typename = node.typename;

    if (node.id !== this.node.id && this.root.selector(node)) {
      // Only visit a node once, this is important since
      // we are traversing the components and routers too.
      // Which can lead to infinite loops.
      if (!this.root.visitedNodeIds.includes(nodeId)) {
        this.root.visitedNodeIds.push(nodeId);
        const tag = this.root.tagSelector ? this.root.tagSelector(node) : null;
        this.children.push(new TraverseNode(this.root, this, node, tag));
      }
    }

    // Traverse the parameter routes in a Router node
    if (this.root.traverseRouter && typename === 'Router') {
      // Can be undefined when there are no pages
      node.parameters.pages?.routes.forEach((componentName) => {
        const component = this.root.project.getComponentWithName(componentName);
        if (component) {
          // NOTE: Root is always "Page"
          component.graph.roots.forEach((child) => {
            this.traverse(child);
          });
        }
      });
    }

    //Traverse the pages in a Component Stack
    if (this.root.traverseComponentStacks && typename === 'Page Stack') {
      // Can be undefined when there are no pages
      node.parameters.pages?.forEach(({ id }) => {
        const componentName = node.parameters['pageComp-' + id];
        const pagePath = node.parameters['pagePath-' + id];

        if (componentName) {
          const component = this.root.project.getComponentWithName(componentName);
          if (component) {
            if (node.parameters.useRoutes && pagePath) {
              const pathProxyNode = {
                id: node.id + '-' + id,
                typename: 'Page Stack Proxy Path',
                type: null,
                parameters: { route: pagePath && pagePath[0] === '/' ? pagePath.substring(1) : pagePath },
                children: component.graph.roots
              };

              // HACK: Fake the NodeGraphNode type
              this.traverse(pathProxyNode as unknown as NodeGraphNode);
            } else {
              component.graph.roots.forEach((child) => {
                this.traverse(child);
              });
            }
          }
        }
      });
    }

    // Traverse the component
    if (this.root.traverseComponent && node.type instanceof ComponentModel) {
      const component = this.root.project.getComponentWithName(node.type.name);
      if (component) {
        component.graph.roots.forEach((child) => {
          this.traverse(child);
        });
      }
    }

    // Traverse all the children
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        this.traverse(child);
      });
    }
  }
}
