import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { UserBadgeList } from './UserBadgeList';

export default {
  title: 'User/UserBadgeList',
  component: UserBadgeList,
  argTypes: {}
} as ComponentMeta<typeof UserBadgeList>;

const Template: ComponentStory<typeof UserBadgeList> = (args) => <UserBadgeList {...args} />;

export const Common = Template.bind({});
Common.args = {
  badges: [
    {
      email: 'kotte@noodl.net',
      id: 'kotte',
      name: 'Kotte Aistre'
    },
    {
      email: 'eric@noodl.net',
      id: 'eric',
      name: 'Eric Tuvesson'
    },
    {
      email: 'michael@noodl.net',
      id: 'michael',
      name: 'Michael Cartner'
    }
  ]
};
