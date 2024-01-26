import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { TitleBar, TitleBarState } from './TitleBar';

export default {
  title: 'App/Title Bar',
  component: TitleBar,
  argTypes: {}
} as ComponentMeta<typeof TitleBar>;

const Template: ComponentStory<typeof TitleBar> = (args) => (
  <div style={{ position: 'relative', width: 950, height: 40 }}>
    <TitleBar {...args}></TitleBar>
  </div>
);

export const Common = Template.bind({});
Common.args = {
  title: 'Noodl Storybook',
  version: '2.6.5',
  isWindows: false
};

export const IsWindows = Template.bind({});
IsWindows.args = {
  title: 'Noodl Storybook',
  version: '2.6.5',
  isWindows: true
};

export const UpdateAvailable = Template.bind({});
UpdateAvailable.args = {
  title: 'Noodl Storybook',
  version: '2.6.5',
  versionAvailable: '2.6.6',
  state: TitleBarState.UpdateAvailable,
  isWindows: true
};

export const Updated = Template.bind({});
Updated.args = {
  title: 'Noodl Storybook',
  version: '2.6.5',
  state: TitleBarState.Updated,
  isWindows: true
};
