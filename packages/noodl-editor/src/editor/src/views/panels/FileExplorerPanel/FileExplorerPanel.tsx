import React from 'react';

import { Box } from '@noodl-core-ui/components/layout/Box';
import { Tabs, TabsVariant } from '@noodl-core-ui/components/layout/Tabs';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';

export function FileExplorerPanel() {
  return (
    <BasePanel title="File Explorer" isFill>
      <Tabs
        variant={TabsVariant.Sidebar}
        tabs={[
          {
            label: 'Project',
            content: <FileExplorer_Project />
          }
        ]}
      />
    </BasePanel>
  );
}

function FileExplorer_Project() {
  return (
    <Box hasXSpacing hasYSpacing>
      Files
    </Box>
  );
}
