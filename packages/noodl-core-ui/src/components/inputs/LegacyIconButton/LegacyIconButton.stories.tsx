import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { LegacyIconButton } from './LegacyIconButton';

export default {
  title: 'Inputs/Legacy Icon Button',
  component: LegacyIconButton,
  argTypes: {},
} as ComponentMeta<typeof LegacyIconButton>;

const Template: ComponentStory<typeof LegacyIconButton> = (args) => (
  <>
    DONT USE THIS COMPONENT
    <LegacyIconButton {...args} />
  </>
);

export const Common = Template.bind({});
Common.args = {};
