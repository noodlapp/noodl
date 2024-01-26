import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { UserBadge, UserBadgeSize } from './UserBadge';

export default {
  title: 'User/User Badge',
  component: UserBadge,
  argTypes: {
    name: { control: 'text' },
    email: { control: 'text' },
    id: { control: 'text' }
  }
} as ComponentMeta<typeof UserBadge>;

const Template: ComponentStory<typeof UserBadge> = (args) => <UserBadge {...args} />;

export const Common = Template.bind({});
Common.args = {
  name: 'John Doe',
  email: 'john@noodl.net',
  id: '20'
};

export const SizeMedium = Template.bind({});
SizeMedium.args = {
  name: 'John Doe',
  email: 'john@noodl.net',
  id: '20',
  size: UserBadgeSize.Medium
};

export const SizeSmall = Template.bind({});
SizeSmall.args = {
  name: 'John Doe',
  email: 'john@noodl.net',
  id: '20',
  size: UserBadgeSize.Small
};

export const TinySmall = Template.bind({});
TinySmall.args = {
  name: 'John Doe',
  email: 'john@noodl.net',
  id: '20',
  size: UserBadgeSize.Tiny
};
