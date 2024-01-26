# Create a Sidebar HOWTO

## Creating a sidebar

```tsx
import React, { useState } from 'react';
import { ReactView } from '../../../../shared/ReactView';

import { UndoQueue } from '@noodl-models/undo-queue-model';

import { PrimaryButton } from '@noodl-core-ui/inputs/PrimaryButton';
import { Container, ContainerDirection } from '@noodl-core-ui/layout/Container';

function UndoQueuePanel({}) {
  const [queue, setQueue] = useState([]);

  function refresh() {
    const undoQueue: TSFixme[] = UndoQueue.instance.queue;
    setQueue([...undoQueue]);
  }

  return (
    <>
      <Container hasXSpacing hasYSpacing>
        <PrimaryButton label="Refresh" onClick={refresh} isGrowing />
      </Container>
      <Container hasXSpacing hasYSpacing direction={ContainerDirection.Vertical}>
        {queue.map((item, index) => (
          <PrimaryButton key={index} label={item.label} isGrowing />
        ))}
      </Container>
    </>
  );
}

// NOTE: Once Frames component is rewritten to React we don't need to have the
//       ReactView here.
export class UndoQueuePanelView extends ReactView<{}> {
  constructor(args) {
    super({});
  }

  protected renderReact(props: {}): JSX.Element {
    return UndoQueuePanel({});
  }
}
```

## Register the Sidebar

```ts
SidebarModel.instance.register({
  hidden: false,
  id: 'undo-queue',
  name: 'Undo Queue',
  order: 10,
  icon: 'sidebar-toolbar-components-icon',
  panel: (args) => new UndoQueuePanelView()
});
```

## Special Sidebar for a Node

Define the sidebar panel you want the node to have in the node definition.
This will open that sidebar panel when the node is selected.

```ts
{
  panels: [
    {
      name: "PortEditor",
    }
  ],
}
```
