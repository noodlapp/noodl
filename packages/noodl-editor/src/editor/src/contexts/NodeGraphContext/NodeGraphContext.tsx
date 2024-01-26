import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

import { ComponentModel } from '@noodl-models/componentmodel';
import { SidebarModel } from '@noodl-models/sidebar';
import { isComponentModel_CloudRuntime } from '@noodl-utils/NodeGraph';

import { Slot } from '@noodl-core-ui/types/global';

import { CenterToFitMode, NodeGraphEditor } from '../../views/nodegrapheditor';

type NodeGraphID = 'frontend' | 'backend';

interface NodeGraphControlSwitchOptions {
  pushHistory: boolean;
  selectSheet?: boolean;
  breadcrumbs?: boolean;
  node?: TSFixme;
}

export interface NodeGraphControlContext {
  active: NodeGraphID;

  nodeGraph: NodeGraphEditor;

  switchToComponent(component: ComponentModel, options: NodeGraphControlSwitchOptions): void;
}

const NodeGraphContext = createContext<NodeGraphControlContext>({
  active: null,
  nodeGraph: null,
  switchToComponent: null
});

export interface NodeGraphContextProviderProps {
  children: Slot;
}

export class NodeGraphContextTmp {
  public static active: NodeGraphControlContext['active'];
  public static nodeGraph: NodeGraphControlContext['nodeGraph'];
  public static switchToComponent: NodeGraphControlContext['switchToComponent'];
}

export function NodeGraphContextProvider({ children }: NodeGraphContextProviderProps) {
  const [active, setActive] = useState<NodeGraphID>(null);
  const [nodeGraph, setNodeGraph] = useState<NodeGraphEditor>(null);

  //create node graph, and support hot reloading it
  useEffect(() => {
    function createNodeGraph() {
      const newNodeGraph = new NodeGraphEditor({});
      newNodeGraph.render();
      return newNodeGraph;
    }

    let currentInstance = createNodeGraph();
    setNodeGraph(currentInstance);
    if (import.meta.webpackHot) {
      import.meta.webpackHot.accept('../../views/nodegrapheditor', () => {
        const activeComponent = currentInstance.activeComponent;
        currentInstance.dispose();
        const newInstance = createNodeGraph();
        newInstance.switchToComponent(activeComponent);

        setNodeGraph(newInstance);
        currentInstance = newInstance;
      });
    }

    return () => {
      currentInstance.dispose();
    };
  }, []);

  const switchToComponent: NodeGraphControlContext['switchToComponent'] = useCallback(
    (component, options) => {
      if (!component) return;

      nodeGraph.switchToComponent(component, options);
    },
    [nodeGraph]
  );

  //switch sidebar panel when components are selected in the node graph
  useEffect(() => {
    if (!nodeGraph) return;

    function _update(model: ComponentModel) {
      if (isComponentModel_CloudRuntime(model)) {
        setActive('backend');
        if (SidebarModel.instance.ActiveId === 'components') {
          SidebarModel.instance.switch('cloud-functions');
        }
      } else {
        setActive('frontend');
        if (SidebarModel.instance.ActiveId === 'cloud-functions') {
          SidebarModel.instance.switch('components');
        }
      }
    }

    const eventGroup = {};
    nodeGraph.on(
      'activeComponentChanged',
      ({ model }: { model: ComponentModel }) => {
        _update(model);
      },
      eventGroup
    );

    _update(nodeGraph.activeComponent);

    return () => {
      nodeGraph.off(eventGroup);
    };
  }, [nodeGraph]);

  // Screenshot helper
  useEffect(() => {
    function setupScreenshot() {
      window.resizeTo(1920, 1080);

      // Something something Panel size = default

      // Allow the resize to do it's thing first
      setTimeout(() => {
        nodeGraph.centerToFit(CenterToFitMode.AllNodes);
      }, 50);
    }

    // @ts-expect-error
    window.setupScreenshot = setupScreenshot;
    return function () {
      // @ts-expect-error
      window.setupScreenshot = undefined;
    };
  }, []);

  //set global on a singleton for code that can't access the react context
  useEffect(() => {
    if (!nodeGraph) return;

    NodeGraphContextTmp.switchToComponent = switchToComponent;
    NodeGraphContextTmp.nodeGraph = nodeGraph;

    return () => {
      NodeGraphContextTmp.active = null;
      NodeGraphContextTmp.nodeGraph = null;
      NodeGraphContextTmp.switchToComponent = null;
    };
  }, [nodeGraph]);

  NodeGraphContextTmp.active = active;

  return (
    <NodeGraphContext.Provider
      value={{
        active,
        nodeGraph,
        switchToComponent
      }}
    >
      {children}
    </NodeGraphContext.Provider>
  );
}

export function useNodeGraphContext() {
  const context = useContext(NodeGraphContext);

  if (context === undefined) {
    throw new Error('useNodeGraphContext must be a child of NodeGraphContextProvider');
  }

  return context;
}
