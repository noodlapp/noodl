import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Box } from './Box';
import { Text } from '@noodl-core-ui/components/typography/Text';

export default {
  title: 'Layout/Box',
  component: Box,
  argTypes: {}
} as ComponentMeta<typeof Box>;

const Template: ComponentStory<typeof Box> = (args) => (
  <div style={{ width: 280 }}>
    <Box {...args}>
      <Text>Text</Text>
    </Box>
  </div>
);

export const Common = Template.bind({});
Common.args = {};
