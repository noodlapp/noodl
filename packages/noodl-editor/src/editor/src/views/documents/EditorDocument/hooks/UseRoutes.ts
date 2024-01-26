import { useEffect, useState } from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';
import { getIndexedPages } from '@noodl-utils/compilation/context/pages';
import { NodeGraphTraverser, TraverseNode } from '@noodl-utils/node-graph-traverser';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';

export function useRoutes(projectModel: ProjectModel, eventDispatcher: EventDispatcher): string[] {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    async function updateRoutes() {
      const pages = await getIndexedPages(projectModel, {
        expandPaths: async (route) => {
          return [
            {
              title: route.title,
              path: route.current.path,
              meta: {}
            }
          ];
        }
      });

      const { navigationPathType } = projectModel.getSettings();

      const prefix = navigationPathType === undefined || navigationPathType === 'hash' ? '/#' : '';
      const pageRoutes = pages.map((p) => p.path);
      const routes = pageRoutes.concat(getComponentStackComponents()).map((path) => prefix + path);
      routes.sort();
      setRoutes(routes);
    }

    updateRoutes();

    const group = {};
    eventDispatcher.on(['Model.componentAdded', 'Model.componentRemoved'], updateRoutes, group);
    eventDispatcher.on(
      'Model.parametersChanged',
      (event) => {
        if (
          event.model?.typename === 'Page' ||
          event.model?.typename === 'Router' ||
          event.model?.typename === 'Page Stack'
        ) {
          updateRoutes();
        }
      },
      group
    );
    projectModel.on('settingsChanged', updateRoutes, group);

    return () => {
      eventDispatcher.off(group);
      projectModel.off(group);
    };
  }, [eventDispatcher, projectModel]);

  return routes;
}

function getComponentStackComponents() {
  const traverser = new NodeGraphTraverser(ProjectModel.instance, (node) => node.typename === 'Page Stack Proxy Path', {
    traverseComponentStacks: true
  });

  const componentStacks: TraverseNode[] = traverser.filter((node) => node.node.typename === 'Page Stack Proxy Path');

  const fullRoutes = componentStacks
    .map((node) => {
      const parentsAndSelf = node.parents(traverser.selector).reverse();
      parentsAndSelf.push(node);

      return (
        '/' +
        parentsAndSelf
          .map((n) => n.node.parameters.route)
          .filter((r) => !!r)
          .join('/')
      );
    })
    .filter((r) => !!r && r !== '/');

  return Array.from(new Set(fullRoutes));
}
