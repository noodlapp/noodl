import React, { useEffect, useState } from 'react';
import { DiffType, ITextDiff } from '@noodl/git/src/core/models/diff-data';

import { IDocumentProvider } from '@noodl-models/app_registry';
import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';

import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';

import { Frame } from '../../common/Frame';
import { NodeGraphEditor } from '../../nodegrapheditor';
import { CodeDiffDialog } from './CodeDiffDialog';
import { ComponentDiffTopbar } from './ComponentDiffTopbar/ComponentDiffTopbar';

interface ComponentDiffDocumentProps {
  component: ComponentModel;
  title: string;
}

function ComponentDiffDocument({ component, title }: ComponentDiffDocumentProps) {
  const [nodeGraph] = useState<NodeGraphEditor>(() => {
    const ng = new NodeGraphEditor({});
    ng.setReadOnly(true);
    ng.render();
    return ng;
  });

  const [codeDiff, setCodeDiff] = useState<ITextDiff>(null);

  useEffect(() => {
    const eventGroup = {};

    nodeGraph.on('readOnlyNodeClicked', (node: NodeGraphNode) => {
      if (!node.annotation) {
        return;
      }

      const port = node.getPorts('input').find((port) => !!port.type.codeeditor);

      if (port && node.parameters[port.name]) {
        const theirs = node.parameters[port.name];
        const ours = node.diffData?.parent.parameters[port.name];

        if (ours !== theirs) {
          setCodeDiff({
            kind: DiffType.Text,
            original: ours,
            modified: theirs as string
          });
        }
      } else {
        const theirs = JSON.stringify(node.parameters, null, 2);
        const ours = node.diffData ? JSON.stringify(node.diffData.parent.parameters, null, 2) : undefined;
        if (ours !== theirs) {
          setCodeDiff({
            kind: DiffType.Text,
            original: ours,
            modified: theirs
          });
        }
      }
    });

    return () => {
      nodeGraph.off(eventGroup);
      nodeGraph.dispose();
    };
  }, []);

  useEffect(() => {
    nodeGraph.switchToComponent(component);
  }, [component]);

  return (
    <Container direction={ContainerDirection.Vertical} isFill>
      <CodeDiffDialog onClose={() => setCodeDiff(null)} diff={codeDiff} />

      <ComponentDiffTopbar title={title} />
      <Frame
        instance={nodeGraph}
        onResize={(bounds) => {
          nodeGraph.resize(bounds);
        }}
      />
    </Container>
  );
}

export class ComponentDiffDocumentProvider implements IDocumentProvider {
  public static ID = 'ComponentDiffDocumentProvider';

  getComponent() {
    return ComponentDiffDocument;
  }
}
