import { ComponentStory, ComponentMeta } from '@storybook/react';
import React, { useState } from 'react';

import { Select } from './Select';

export default {
  title: 'Inputs/Select',
  component: Select,
  argTypes: {
    options: {
      defaultValue: [
        {
          label: 'Volvo',
          value: 'volvo'
        },
        {
          label: 'Saab',
          value: 'saab'
        },
        {
          label: 'Mercedes',
          value: 'mercedes'
        },
        {
          label: 'Audi',
          value: 'audi'
        }
      ]
    }
  }
} as ComponentMeta<typeof Select>;

const Template: ComponentStory<typeof Select> = (args) => {
  const [value, setValue] = useState(null);

  return <Select {...args} value={value} onChange={setValue} />;
};

export const Common = Template.bind({});
Common.args = {};

export const InFlexColumn: ComponentStory<typeof Select> = (args) => (
  <div
    style={{
      display: 'flex',
      height: 500,
      backgroundColor: '#000',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: 20
    }}
  >
    <Template {...args} />
  </div>
);

export const AtBottom: ComponentStory<typeof Select> = (args) => (
  <div
    style={{
      display: 'flex',
      height: 500,
      backgroundColor: '#000',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: 20
    }}
  >
    <div>
      <Template {...args} />
    </div>
  </div>
);
