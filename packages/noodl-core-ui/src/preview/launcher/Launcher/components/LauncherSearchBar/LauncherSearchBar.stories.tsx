import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { LauncherSearchBar } from './LauncherSearchBar';

export default {
  title: 'CATEGORY_HERE/LauncherSearchBar',
  component: LauncherSearchBar,
  argTypes: {},
} as ComponentMeta<typeof LauncherSearchBar>;

const Template: ComponentStory<typeof LauncherSearchBar> = (args) => <LauncherSearchBar {...args} />;

export const Common = Template.bind({});
Common.args = {};