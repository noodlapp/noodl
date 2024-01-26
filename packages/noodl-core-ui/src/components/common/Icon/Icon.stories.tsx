import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Icon, IconName } from './Icon';

export default {
  title: 'Common/Icon',
  component: Icon,
  argTypes: {
    icon: { control: 'select', options: IconName }
  }
} as ComponentMeta<typeof Icon>;

const Template: ComponentStory<typeof Icon> = (args) => <Icon {...args} />;

export const Common = Template.bind({});
Common.args = {};
