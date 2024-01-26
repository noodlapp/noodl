import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Label } from './Label';

export default {
  title: 'Typography/Label',
  component: Label,
  argTypes: {}
} as ComponentMeta<typeof Label>;

const Template: ComponentStory<typeof Label> = (args) => (
  <>
    <p>
      This component is a work in progress and will be rolled out in the future to replace Title and
      Text in a few instances
    </p>
    <Label {...args} />
  </>
);

export const Common = Template.bind({});
Common.args = {};
