import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Text } from './Text';

export default {
  title: 'CATEGORY_HERE/Text',
  component: Text,
  argTypes: {}
} as ComponentMeta<typeof Text>;

const Template: ComponentStory<typeof Text> = (args) => <Text {...args} />;

export const Common = Template.bind({});
Common.args = {};
