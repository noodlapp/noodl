import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { IconButton } from '@noodl-core-ui/components/inputs/IconButton';
import { Container } from '@noodl-core-ui/components/layout/Container';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Text } from '@noodl-core-ui/components/typography/Text';

import { Section, SectionVariant } from './Section';

export default {
  title: 'Layout/Section',
  component: Section,
  argTypes: {}
} as ComponentMeta<typeof Section>;

const Template: ComponentStory<typeof Section> = (args) => (
  <div style={{ width: 280 }}>
    <Section {...args}>
      <Container hasYSpacing>
        <Text>Hello World</Text>
      </Container>
    </Section>
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
    <Section title="I do not have a scrollbar">
      <VStack hasSpacing>
        {[...new Array(100)].map((_, i) => (
          <Text>Hello World {i}</Text>
        ))}
      </VStack>
    </Section>
  </div>
);
