import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { ScrollArea } from './ScrollArea';

export default {
  title: 'Layout/ScrollArea',
  component: ScrollArea,
  argTypes: {}
} as ComponentMeta<typeof ScrollArea>;

const Template: ComponentStory<typeof ScrollArea> = (args) => <ScrollArea {...args} />;

export const Common = Template.bind({});
Common.args = {};
