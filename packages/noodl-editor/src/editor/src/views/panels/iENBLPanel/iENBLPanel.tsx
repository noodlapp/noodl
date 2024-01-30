import { useActiveEnvironment } from '@noodl-hooks/useActiveEnvironment';
import { ipcRenderer } from 'electron';
import React, { useEffect } from 'react';

import { Keybindings } from '@noodl-constants/Keybindings';
import { ProjectModel } from '@noodl-models/projectmodel';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { ActionButton, ActionButtonVariant } from '@noodl-core-ui/components/inputs/ActionButton';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';

import { ComponentsPanel } from '../componentspanel';

export function iENBLPanel() {
  const environment = useActiveEnvironment(ProjectModel.instance);

  const componentPanelOptions = {
    showSheetList: false,
    lockCurrentSheetName: '__neue__',
    componentTitle: 'Flows'
  };

  return (
    <BasePanel title="Neue Playground" isFill>
      <Container direction={ContainerDirection.Vertical} isFill>
        <div style={{ flex: '1', overflow: 'hidden' }}>
          <ComponentsPanel options={componentPanelOptions} />
        </div>
      </Container>
    </BasePanel>
  );
}
