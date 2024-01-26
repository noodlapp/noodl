import { useProjectDesignTokenContext } from '@noodl-contexts/ProjectDesignTokenContext';
import React from 'react';

import { IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { ContextMenu } from '@noodl-core-ui/components/popups/ContextMenu';
import { CollapsableSection } from '@noodl-core-ui/components/sidebar/CollapsableSection';
import { SectionVariant } from '@noodl-core-ui/components/sidebar/Section';
import { ColorListView } from '@noodl-core-ui/components/tree-view/ColorListView';

export function ColorsTab() {
  const { staticColors, dynamicColors } = useProjectDesignTokenContext();

  return (
    <>
      <CollapsableSection
        title="Styles"
        variant={SectionVariant.Panel}
        UNSAFE_style={{
          marginTop: '16px'
        }}
      >
        <ColorListView
          items={staticColors.map((x) => ({
            id: x.name,
            text: x.name,
            color: x.color,
            endSlot: (
              <ContextMenu
                variant={IconButtonVariant.SemiTransparent}
                menuItems={[
                  {
                    label: 'Another Action'
                  },
                  'divider',
                  {
                    label: 'Success'
                  },
                  {
                    label: 'Danger',
                    isDangerous: true
                  },
                  {
                    label: 'With subtitle',
                    endSlot: 'Subtitle goes here'
                  }
                ]}
              />
            )
          }))}
        />
      </CollapsableSection>
      <CollapsableSection
        title="Project colors"
        variant={SectionVariant.Panel}
        UNSAFE_style={{
          marginTop: '8px'
        }}
      >
        <ColorListView
          items={dynamicColors.map((x) => ({
            id: x.name,
            text: x.name,
            color: x.color
          }))}
        />
      </CollapsableSection>
    </>
  );
}
