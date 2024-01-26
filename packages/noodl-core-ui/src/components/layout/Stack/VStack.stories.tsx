import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Text } from '@noodl-core-ui/components/typography/Text';

import { VStack } from '../Stack/Stack';

export default {
  title: 'Layout/VStack',
  component: VStack,
  argTypes: {}
} as ComponentMeta<typeof VStack>;

const Template: ComponentStory<typeof VStack> = (args) => (
  <div style={{ width: 280 }}>
    <VStack {...args}></VStack>
  </div>
);

export const Common = Template.bind({});
Common.args = {};

const ListTemplate: ComponentStory<typeof VStack> = (args) => (
  /* Showcase how it is when the size is set on the parent */
  <div style={{ width: 500, height: 500 }}>
    <VStack {...args}>
      {[...Array(10)].map((_, i) => (
        <Text>Item {i}</Text>
      ))}
    </VStack>
  </div>
);

export const List = ListTemplate.bind({});

export const ListSpacing = ListTemplate.bind({});
ListSpacing.args = {
  hasSpacing: true
};
