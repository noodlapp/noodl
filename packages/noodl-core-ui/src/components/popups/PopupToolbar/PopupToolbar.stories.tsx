import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { PopupToolbar, PopupToolbarProps } from '@noodl-core-ui/components/popups/PopupToolbar/PopupToolbar';

export default {
  title: 'Popups/PopupToolbar',
  component: PopupToolbar,
  argTypes: {}
} as ComponentMeta<typeof PopupToolbar>;

const Template: ComponentStory<typeof PopupToolbar> = (args: PopupToolbarProps) => (
  <div style={{ width: '100vw', height: '100vh' }}>
    <PopupToolbar {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  menuItems: [
    {
      tooltip: 'Action',
      icon: IconName.Plus
    },
    {
      tooltip: 'Action',
      icon: IconName.Plus
    }
  ],
  contextMenuItems: [
    {
      label: 'Action',
      icon: IconName.Plus
    },
    {
      label: 'Another Action'
    },
    'divider',
    {
      label: 'Success'
    },
    {
      label: 'Danger',
      isDangerous: true
    },
    {
      label: 'Copy Me',
      icon: IconName.Copy
    },
    {
      label: 'With subtitle',
      endSlot: 'Subtitle goes here'
    }
  ]
};

export const NoContextMenu = Template.bind({});
NoContextMenu.args = {
  menuItems: [
    {
      tooltip: 'Action',
      icon: IconName.Plus
    },
    {
      tooltip: 'Action',
      icon: IconName.Plus
    }
  ]
};
