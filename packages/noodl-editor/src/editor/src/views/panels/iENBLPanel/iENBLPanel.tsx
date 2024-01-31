import { useActiveEnvironment } from '@noodl-hooks/useActiveEnvironment';
import React, { useEffect } from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';

import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';

import { ComponentsPanel } from '../componentspanel';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';

export function iENBLPanel() {
  const environment = useActiveEnvironment(ProjectModel.instance);
  

  const componentPanelOptions = {
    showSheetList: false,
    lockCurrentSheetName: '__neue__',
    componentTitle: 'Neue components'
  };

  return (
    <BasePanel title="Neue Playground" isFill>
      <Container direction={ContainerDirection.Vertical} isFill>
        <Box hasXSpacing hasYSpacing>
            <VStack>
              <PrimaryButton label="Publish configuration to device" onClick={() => console.log('press')} />
            </VStack>
        </Box>
      <Section
            title="Available Devices"
            variant={SectionVariant.Panel}
          >
          </Section>
        <div style={{ flex: '1', overflow: 'hidden' }}>
          <ComponentsPanel options={componentPanelOptions} />
        </div>
      </Container>
    </BasePanel>
  );
}
