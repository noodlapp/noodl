import React from 'react';

import { UndoQueue } from '@noodl-models/undo-queue-model';

import { useModel } from '@noodl-hooks/useModel';
import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';
import { ExperimentalFlag } from '@noodl-core-ui/components/sidebar/ExperimentalFlag';

export function UndoQueuePanel({}) {
  const undoQueue = useModel(UndoQueue.instance, ['undoHistoryChanged', 'undo', 'redo']);

  const historyLocation = undoQueue.getHistoryLocation();
  const history = [...undoQueue.getHistory()].reverse();

  return (
    <BasePanel title="History">
      <ExperimentalFlag />

      <Container hasXSpacing hasYSpacing direction={ContainerDirection.Vertical}>
        {history.map((item, index) => (
          <PrimaryButton key={index} label={item.label} isGrowing hasBottomSpacing />
        ))}
      </Container>
    </BasePanel>
  );
}
