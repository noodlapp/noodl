import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ListItem } from './ListItem';
import { Icon, IconName } from '@noodl-core-ui/components/common/Icon';

export default {
  title: 'Layout/List Item',
  component: ListItem,
  argTypes: {}
} as ComponentMeta<typeof ListItem>;

const Template: ComponentStory<typeof ListItem> = (args) => (
  <div style={{ width: 280 }}>
    <ListItem {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  icon: IconName.Home,
  text: 'Home'
};

export const isDisabled = Template.bind({});
isDisabled.args = {
  icon: IconName.Home,
  text: 'Home',
  isDisabled: true
};

export const withAffix = Template.bind({});
withAffix.args = {
  icon: IconName.Home,
  text: 'Home',
  affix: <Icon icon={IconName.ImportDown} />
};
