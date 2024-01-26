import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { Image } from './Image';

export default {
  title: 'CATEGORY_HERE/Image',
  component: Image,
  argTypes: {}
} as ComponentMeta<typeof Image>;

const Template: ComponentStory<typeof Image> = (args) => <Image {...args} />;

export const Common = Template.bind({});
Common.args = {};
