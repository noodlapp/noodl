import { useActiveEnvironment } from '@noodl-hooks/useActiveEnvironment';
import { ipcRenderer } from 'electron';
import React from 'react';

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

export function CloudFunctionsPanel() {
  const environment = useActiveEnvironment(ProjectModel.instance);

  const componentPanelOptions = {
    showSheetList: false,
    lockCurrentSheetName: '__cloud__',
    componentTitle: 'Cloud Components'
  };

  return (
    <BasePanel title="Cloud Functions" isFill>
      <Container direction={ContainerDirection.Vertical} isFill>
        <ActionButton
          prefixText="Active cloud service"
          label={environment?.name}
          icon={IconName.CloudData}
          variant={ActionButtonVariant.Default}
          isInactive
        />

        <Box hasXSpacing hasYSpacing>
          <VStack>
            <Box hasBottomSpacing>
              <Tooltip content="Open cloud dev tools" fineType={Keybindings.OPEN_CLOUD_DEVTOOLS.label}>
                <PrimaryButton
                  icon={IconName.Bug}
                  label="Open cloud dev tools"
                  size={PrimaryButtonSize.Small}
                  variant={PrimaryButtonVariant.MutedOnLowBg}
                  onClick={() => ipcRenderer.send('cloud-runtime-open-devtools')}
                  isGrowing
                />
              </Tooltip>
            </Box>
            <Tooltip content="Refresh cloud functions">
              <PrimaryButton
                icon={IconName.Refresh}
                label="Refresh cloud functions"
                size={PrimaryButtonSize.Small}
                variant={PrimaryButtonVariant.MutedOnLowBg}
                onClick={() => ipcRenderer.send('cloud-runtime-refresh')}
                isGrowing
              />
            </Tooltip>
          </VStack>
        </Box>

        <div style={{ flex: '1', overflow: 'hidden' }}>
          <ComponentsPanel options={componentPanelOptions} />
        </div>
      </Container>
    </BasePanel>
  );
}
