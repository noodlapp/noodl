import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { CarouselIndicatorDot } from './CarouselIndicatorDot';

export default {
  title: 'Layout/Carousel Indicator Dot',
  component: CarouselIndicatorDot,
  argTypes: {}
} as ComponentMeta<typeof CarouselIndicatorDot>;

const Template: ComponentStory<typeof CarouselIndicatorDot> = (args) => <CarouselIndicatorDot {...args} />;

export const Common = Template.bind({});
Common.args = {};
