import { useModel } from '@noodl-hooks/useModel';
import React from 'react';

import { SidebarModel } from '@noodl-models/sidebar';
import { EditorSettings } from '@noodl-utils/editorsettings';

import { Checkbox, CheckboxVariant } from '@noodl-core-ui/components/inputs/Checkbox';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';
import { CollapsableSection } from '@noodl-core-ui/components/sidebar/CollapsableSection';
import { ExperimentalFlag, ExperimentalFlagVariant } from '@noodl-core-ui/components/sidebar/ExperimentalFlag';
import { Text, TextSize } from '@noodl-core-ui/components/typography/Text';

import { OpenAiSection } from './sections/OpenAiSection';

export function EditorSettingsPanel() {
  // @ts-expect-error Model is yeah, not great!
  useModel(EditorSettings.instance, ['updated']);

  const experimentalPanels = SidebarModel.instance.getExperimentalItems();

  const experimentalFeautures = [
    {
      id: 'nodeGraphEditor.snapToGrid',
      settingsKey: 'nodeGraphEditor.snapToGrid',
      name: 'Snap nodes to grid',
      description: '',
      enabled: !!EditorSettings.instance.get('nodeGraphEditor.snapToGrid')
    }
  ];

  return (
    <BasePanel title="Editor Settings" hasContentScroll>
      {Boolean(experimentalPanels.length) && (
        <>
          <CollapsableSection title="Experimental panels" isClosed>
            <ExperimentalFlag variant={ExperimentalFlagVariant.Small} />
            <Box hasXSpacing hasTopSpacing={1} hasBottomSpacing={5}>
              <VStack hasSpacing>
                {experimentalPanels.map((item) => (
                  <ExperimentalFeautureItem key={item.id} {...item} labelPrefix="Enable " />
                ))}
              </VStack>
            </Box>
          </CollapsableSection>
          <CollapsableSection title="Experimental features" isClosed>
            <Box hasXSpacing hasTopSpacing={1} hasBottomSpacing={5}>
              <VStack hasSpacing>
                {experimentalFeautures.map((item) => (
                  <ExperimentalFeautureItem key={item.id} {...item} />
                ))}
              </VStack>
            </Box>
          </CollapsableSection>
          <OpenAiSection />
        </>
      )}
    </BasePanel>
  );
}

function ExperimentalFeautureItem(item) {
  return (
    <Box>
      <Checkbox
        key={item.id}
        label={`${item.labelPrefix || ''}${item.name}`}
        variant={CheckboxVariant.Sidebar}
        isChecked={item.enabled}
        onChange={(ev) => {
          EditorSettings.instance.set(item.settingsKey, ev.target.checked);
        }}
      />
      {Boolean(item.description) && (
        <Box hasXSpacing hasTopSpacing>
          <Text size={TextSize.Medium}>{item.description}</Text>
        </Box>
      )}
    </Box>
  );
}
