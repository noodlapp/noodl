import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Launcher } from './Launcher';

export default {
  title: 'Preview/Launcher/[WIP] Launcher',
  component: Launcher,
  argTypes: {}
} as ComponentMeta<typeof Launcher>;

const Template: ComponentStory<typeof Launcher> = (args) => <Launcher {...args}></Launcher>;

export const Primary = Template.bind({});
Primary.args = {};
