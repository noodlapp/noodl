import { useProjectDesignTokenContext } from '@noodl-contexts/ProjectDesignTokenContext';
import React from 'react';

import { Box } from '@noodl-core-ui/components/layout/Box';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Tabs, TabsVariant } from '@noodl-core-ui/components/layout/Tabs';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';
import { Section } from '@noodl-core-ui/components/sidebar/Section';
import { Label } from '@noodl-core-ui/components/typography/Label';

import { ColorsTab } from './components/ColorsTab';

export function DesignTokenPanel() {
  const { textStyles } = useProjectDesignTokenContext();

  return (
    <BasePanel title="Design Tokens">
      <Tabs
        variant={TabsVariant.Sidebar}
        tabs={[
          {
            label: 'Colors',
            content: <ColorsTab />
          },
          {
            label: 'Typography',
            content: (
              <Section title="Experimental features">
                <Box hasXSpacing hasTopSpacing>
                  <VStack>
                    {textStyles.map((textStyle) => (
                      <Box key={textStyle.name} hasBottomSpacing={1}>
                        <Label>{JSON.stringify(textStyle)}</Label>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </Section>
            )
          }
        ]}
      />
    </BasePanel>
  );
}
