import React, { useEffect, useState } from 'react';

import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { SidebarModel } from '@noodl-models/sidebar';
import { SidebarModelEvent } from '@noodl-models/sidebar/sidebarmodel';
import { UndoActionGroup, UndoQueue } from '@noodl-models/undo-queue-model';

import { ScrollArea } from '@noodl-core-ui/components/layout/ScrollArea';
import { Tabs, TabsVariant } from '@noodl-core-ui/components/layout/Tabs';

import { Frame } from '../../common/Frame';
import { ToastLayer } from '../../ToastLayer/ToastLayer';
import { AiChat } from './components/AiChat';
import { NodeLabel } from './components/NodeLabel';
import { PropertyEditor as PropertyEditorView } from './propertyeditor';

export function NodeGraphNodeRename(model: NodeGraphNode, newname: string) {
  model.setLabel(newname, { undo: true, label: 'change label' });
}

export function NodeGraphNodeDelete(model: NodeGraphNode) {
  if (!model.canBeDeleted()) {
    ToastLayer.showError('This node cannot be deleted');
    return;
  }

  const graph = model.owner;
  const undo = new UndoActionGroup({ label: 'delete node' });
  graph.removeNode(model, { undo: undo });
  UndoQueue.instance.push(undo);
}

export interface PropertyEditorProps {
  model: NodeGraphNode;
}

export function PropertyEditor(props: PropertyEditorProps) {
  const [group] = useState({});
  const [instance, setInstance] = useState<PropertyEditorView>(null);

  useEffect(() => {
    const instance = new PropertyEditorView(props);
    instance.render();
    setInstance(instance);

    SidebarModel.instance.on(
      SidebarModelEvent.receivedCommand,
      (panelId, command, args) => {
        if (panelId !== 'PropertyEditor') return;

        // Disable double click for AI Nodes
        // For now lets allow Function nodes (JavaScriptFunction)
        const aiAssistant = props.model?.metadata?.AiAssistant;
        if (aiAssistant && props.model?.typename !== 'JavaScriptFunction') return;

        switch (command) {
          case 'doubleClick': {
            instance.doubleClick(args.model);
            break;
          }
        }
      },
      group
    );

    return function () {
      SidebarModel.instance.off(group);
    };
  }, []);

  const aiAssistant = props.model?.metadata?.AiAssistant;
  if (aiAssistant) {
    return <AiPropertyEditor {...props} instance={instance} />;
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {Boolean(props.model) && <NodeLabel {...props} />}

      <ScrollArea>
        <Frame instance={instance} isContentSize UNSAFE_style={{ flex: 1 }} />
      </ScrollArea>
    </div>
  );
}

function AiPropertyEditor(props: PropertyEditorProps & { instance: PropertyEditorView }) {
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <NodeLabel {...props} showHelp={false} />
      <Tabs
        variant={TabsVariant.Sidebar}
        tabs={[
          {
            label: 'AI Chat',
            content: (
              <AiChat
                model={props.model}
                onUpdated={() => {
                  // Update the property panel values
                  props.instance.render();
                }}
              />
            )
          },
          {
            label: 'Properties',
            content: (
              <ScrollArea>
                <Frame instance={props.instance} isContentSize UNSAFE_style={{ flex: 1 }} />
              </ScrollArea>
            )
          }
        ]}
      />
    </div>
  );
}
