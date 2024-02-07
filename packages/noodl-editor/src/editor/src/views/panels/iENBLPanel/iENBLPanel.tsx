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
import { Text } from '@noodl-core-ui/components/typography/Text';
import { ActivityIndicator } from '@noodl-core-ui/components/common/ActivityIndicator';

export function iENBLPanel() {
  const environment = useActiveEnvironment(ProjectModel.instance);


  const componentPanelOptions = {
    showSheetList: false,
    lockCurrentSheetName: '__neue__',
    componentTitle: 'Neue components'
  };

  const neueService = {
    backend: {
      items: ['iENBL 2347854', 'iENBL 2347854', 'iENBL 2347854', 'iENBL 2347854'],
      hasError: false,
      isLoading: false
    }
  }

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
        // actions={
        //   <IconButton
        //     icon={IconName.Plus}
        //     size={IconSize.Small}
        //     //onClick={() => setIsCreateModalVisible(true)}
        //     testId="add-cloud-service-tab-button"
        //   />
        // }
        >
          {neueService.backend.items?.length ? (
            <VStack>
              {neueService.backend.items?.map((environment, i) => (
                <Text style={{ margin: '10px 0px 15px 50px' }} key={i}>{environment}</Text>

                // <CloudServiceCardItem
                //   key={environment.id}
                //   environment={environment}
                //   deleteEnvironment={deleteEnvironment}
                // />
              ))}
            </VStack>
          ) : neueService.backend.hasError ? (
            <Box hasXSpacing hasYSpacing>
              <VStack>
                <Text hasBottomSpacing>Failed to load cloud services</Text>
                <PrimaryButton label="Try again." />
              </VStack>
            </Box>
          ) : neueService.backend.isLoading ? (
            <Container hasLeftSpacing hasTopSpacing>
              <ActivityIndicator />
            </Container>
          ) : (
            <Container hasLeftSpacing hasTopSpacing>
              <Text>No cloud services in workspace</Text>
            </Container>
          )}
        </Section>
        <div style={{ flex: '1', overflow: 'hidden' }}>
          <ComponentsPanel options={componentPanelOptions} />
        </div>
      </Container>
    </BasePanel>
  );
}
