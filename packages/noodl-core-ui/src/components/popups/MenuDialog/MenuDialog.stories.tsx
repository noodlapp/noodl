import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { IconName } from '@noodl-core-ui/components/common/Icon';

import { MenuDialog, MenuDialogWidth } from './MenuDialog';

export default {
  title: 'Popups/Menu Dialog',
  component: MenuDialog,
  argTypes: {}
} as ComponentMeta<typeof MenuDialog>;

const Template: ComponentStory<typeof MenuDialog> = (args) => (
  <div>
    <MenuDialog {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  title: 'Preview layout',
  width: MenuDialogWidth.Small,
  isVisible: true,
  // triggerRef: null,
  onClose: () => {},
  items: [
    {
      icon: IconName.Logo,
      label: 'Hello',
      onClick: () => {}
    },
    {
      label: 'Hello',
      onClick: () => {}
    },
    {
      label: 'Hello with normal tooltip',
      onClick: () => {},
      tooltip: 'Hej'
    },
    {
      label: 'Disabled with tooltip',
      isDisabled: true,
      onClick: () => {},
      tooltip: 'Hej',
      tooltipShowAfterMs: 300
    }
  ]
};
