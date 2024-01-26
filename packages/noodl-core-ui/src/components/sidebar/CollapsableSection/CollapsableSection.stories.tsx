import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { IconButton } from '@noodl-core-ui/components/inputs/IconButton';
import { Container } from '@noodl-core-ui/components/layout/Container';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { SectionVariant } from '@noodl-core-ui/components/sidebar/Section';
import { Text } from '@noodl-core-ui/components/typography/Text';

import { CollapsableSection } from './CollapsableSection';

export default {
  title: 'Layout/Collapsable Section',
  component: CollapsableSection,
  argTypes: {}
} as ComponentMeta<typeof CollapsableSection>;

const Template: ComponentStory<typeof CollapsableSection> = (args) => (
  <div style={{ width: 280 }}>
    <CollapsableSection {...args}>
      <Container hasYSpacing>
        <Text>Hello World</Text>
      </Container>
    </CollapsableSection>
  </div>
);

export const Common = Template.bind({});
Common.args = {};

export const VariantPanel = Template.bind({});
VariantPanel.args = {
  title: 'Title',
  variant: SectionVariant.Panel
};

export const CollapsableVariantPanel = Template.bind({});
CollapsableVariantPanel.args = {
  title: 'Title',
  variant: SectionVariant.Panel,
  isCollapsable: true
};

export const VariantPanelShy = Template.bind({});
VariantPanelShy.args = {
  title: 'Title',
  variant: SectionVariant.PanelShy
};

export const VariantInModal = Template.bind({});
VariantInModal.args = {
  title: 'Title',
  variant: SectionVariant.InModal
};

export const WithAction = Template.bind({});
WithAction.args = {
  title: 'Title',
  actions: <IconButton icon={IconName.Plus} />
};

// Boring, but it should be content size and not handle scrollbars
export const ContentSize = () => (
  <div style={{ width: 280, height: 400, overflow: 'hidden' }}>
    <CollapsableSection title="I do not have a scrollbar">
      <VStack hasSpacing>
        {[...new Array(100)].map((_, i) => (
          <Text>Hello World {i}</Text>
        ))}
      </VStack>
    </CollapsableSection>
  </div>
);
