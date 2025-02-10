import React, { createContext, useContext, useState, useEffect } from 'react';

import { type ComponentModel } from '@noodl-models/componentmodel';
import { type NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { type NodeLibraryNodeType } from '@noodl-models/nodelibrary';
import { type Slot } from '@noodl-core-ui/types/global';
import { ProjectModel } from '@noodl-models/projectmodel';
import { EventDispatcher } from '../../../../shared/utils/EventDispatcher';

export type NodeReference = {
  type: NodeLibraryNodeType | undefined;
  displayName: string;
  referenaces: {
    displayName: string;
    node?: NodeGraphNode;
    component: ComponentModel;
  }[];
};

export interface NodeReferencesContext {
  nodeReferences: NodeReference[];
}

const NodeReferencesContext = createContext<NodeReferencesContext>({
  nodeReferences: [],
});

// Since all the editor code is not written in React we need a way to be able to
// access this information outside of React too.
let HACK_nodeReferences: NodeReference[] = [];
export function HACK_findNodeReference(componentName: string): NodeReference | undefined {
  return HACK_nodeReferences.find(x => x.type?.fullName === componentName);
}


export interface NodeReferencesContextProps {
  children: Slot;
}

export function NodeReferencesContextProvider({ children }: NodeReferencesContextProps) {
  const [group] = useState({});
  const [nodeReferences, setNodeReferences] = useState<NodeReference[]>([]);

  useEffect(() => {
    function updateIndex() {
      const types: { [key: string]: NodeReference['type'] } = {};
      const references = new Map<string, NodeReference['referenaces']>();

      function handleComponent(component: ComponentModel) {
        component.forEachNode((node: NodeGraphNode) => {
          const name = node.type.name;

          // Add the reference
          references.set(name, [
            ...(references.get(name) || []),
            {
              displayName: component.displayName || component.name,
              node,
              component
            }
          ]);

          // Repeater
          if (name === 'For Each' && node.parameters.template) {
            const templateComponent = ProjectModel.instance.getComponentWithName(node.parameters.template);

            if (templateComponent) {
              references.set(templateComponent.fullName, [
                ...(references.get(templateComponent.fullName) || []),
                {
                  displayName: component.displayName || component.name,
                  node,
                  component
                }
              ]);

              handleComponent(templateComponent);
            }
          }

          // Add some metadata for this node if we dont have it yet.
          if (!types[name]) {
            types[name] = node.type;
          }
        });
      }

      // Loop all the nodes in the project
      ProjectModel.instance.forEachComponent(handleComponent);

      // Combine the result to look a little better.
      const results: NodeReference[] = Array.from(references.keys())
        .map((key) => ({
          type: types[key],
          displayName: types[key]?.displayName || key,
          referenaces: references.get(key)
        }))
        .sort((a, b) => b.referenaces.length - a.referenaces.length);

      HACK_nodeReferences = results;
      setNodeReferences(results);
    }

    updateIndex();

    EventDispatcher.instance.on(
      [
        'Model.nodeAdded',
        'Model.nodeRemoved',
        'Model.componentAdded',
        'Model.componentRemoved',
        'Model.componentRenamed'
      ],
      updateIndex,
      group
    );

    return function () {
      EventDispatcher.instance.off(group);
    };
  }, []);

  return (
    <NodeReferencesContext.Provider
      value={{
        nodeReferences,
      }}
    >
      {children}
    </NodeReferencesContext.Provider>
  );
}

export function useNodeReferencesContext() {
  const context = useContext(NodeReferencesContext);

  if (context === undefined) {
    throw new Error('useNodeReferencesContext must be a child of NodeReferencesContextProvider');
  }

  return context;
}
