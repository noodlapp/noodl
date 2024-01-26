import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ListItemMenu } from './ListItemMenu';
import { IconName } from '@noodl-core-ui/components/common/Icon';
import { ListItemVariant } from '@noodl-core-ui/components/layout/ListItem/ListItem';

export default {
  title: 'Layout/List Item Menu',
  component: ListItemMenu,
  argTypes: {}
} as ComponentMeta<typeof ListItemMenu>;

const Template: ComponentStory<typeof ListItemMenu> = (args) => (
  <div style={{ width: 280 }}>
    <ListItemMenu {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  icon: IconName.Home,
  text: 'Home',
  menuItems: [
    {
      label: `Compare with main`
    },
    {
      label: `Merge into menu`
    },
    {
      label: 'Delete'
    }
  ]
};

export const ShyWithIcon = Template.bind({});
ShyWithIcon.args = {
  variant: ListItemVariant.Shy,
  icon: IconName.Home,
  text: 'Home',
  menuIcon: IconName.ImportDown,
  menuItems: []
};
