import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { ModalSection } from './ModalSection';

export default {
  title: 'Layout/Modal Section',
  component: ModalSection,
  argTypes: {}
} as ComponentMeta<typeof ModalSection>;

const Template: ComponentStory<typeof ModalSection> = (args) => <ModalSection {...args} />;

export const Common = Template.bind({});
Common.args = {};
