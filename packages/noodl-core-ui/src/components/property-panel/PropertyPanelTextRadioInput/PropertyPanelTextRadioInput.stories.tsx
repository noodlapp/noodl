import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { PropertyPanelTextRadioInput } from './PropertyPanelTextRadioInput';

export default {
  title: 'Property Panel/Radio',
  component: PropertyPanelTextRadioInput,
  argTypes: {}
} as ComponentMeta<typeof PropertyPanelTextRadioInput>;

const Template: ComponentStory<typeof PropertyPanelTextRadioInput> = (args) => (
  <div style={{ width: 280 }}>
    <PropertyPanelTextRadioInput {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  value: 'one',
  properties: {
    options: [
      {
        label: 'One',
        value: 'one'
      },
      {
        label: 'Two',
        value: 'two'
      },
      {
        label: 'Disabled',
        value: 'three',
        isDisabled: true
      }
    ]
  }
};
