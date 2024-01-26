import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Icon } from './Icon';

export default {
  title: 'CATEGORY_HERE/Icon',
  component: Icon,
  argTypes: {},
} as ComponentMeta<typeof Icon>;

const Template: ComponentStory<typeof Icon> = (args) => <Icon {...args} />;

export const Common = Template.bind({});
Common.args = {};