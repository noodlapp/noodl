import { useNodeGraphContext } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import React, { useEffect, useState } from 'react';

import { Frame } from '../../common/Frame';
import { ComponentsPanelOptions, ComponentsPanelView } from './ComponentsPanel';

export interface ComponentsPanelProps {
  options?: ComponentsPanelOptions;
}

export function ComponentsPanel({ options }: ComponentsPanelProps) {
  const [instance, setInstance] = useState<ComponentsPanelView>(null);

  useEffect(() => {
    const instance = new ComponentsPanelView(options);
    instance.render();
    setInstance(instance);

    return () => {
      instance.dispose();
    };
  }, []);

  const nodeGraphContext = useNodeGraphContext();

  useEffect(() => {
    //make sure the node graph is kept up to date through hot reloads
    instance?.setNodeGraphEditor(nodeGraphContext.nodeGraph);
  }, [instance, nodeGraphContext.nodeGraph]);

  return <Frame instance={instance} isFitWidth />;
}
