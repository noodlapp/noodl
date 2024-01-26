import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import {
  PropertyPanelInput,
  PropertyPanelInputType,
} from './PropertyPanelInput';
import { PropertyPanelSection } from '@noodl-core-ui/components/property-panel/PropertyPanelSection';
import { ReactComponent as AlignLeftIcon } from '../../../assets/icons/align-left.svg';
import { ReactComponent as AlignCenterIcon } from '../../../assets/icons/align-center.svg';
import { ReactComponent as AlignRightcon } from '../../../assets/icons/align-right.svg';

export default {
  title: 'Property Panel/# Generic',
  component: PropertyPanelInput,
  argTypes: {},
} as ComponentMeta<typeof PropertyPanelInput>;

const Template: ComponentStory<typeof PropertyPanelInput> = (args) => {
  const [value, setValue] = useState(args.value || '');

  return (
    <div style={{ width: 280 }}>
      <PropertyPanelSection title="Input demo">
        <PropertyPanelInput {...args} value={value} onChange={setValue} />
      </PropertyPanelSection>

      <div style={{ paddingTop: 30 }}>
        Stored value:{' '}
        <input value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
    </div>
  );
};

export const Common = Template.bind({});
Common.args = { label: 'Label' };

export const Text = Template.bind({});
Text.args = {
  inputType: PropertyPanelInputType.Text,
  label: 'Text',
};

export const Number = Template.bind({});
Number.args = {
  inputType: PropertyPanelInputType.Number,
  label: 'Number',
};

export const LengthUnit = Template.bind({});
LengthUnit.args = {
  inputType: PropertyPanelInputType.LengthUnit,
  label: 'Length unit',
  value: '200px',
};

export const Slider = Template.bind({});
Slider.args = {
  inputType: PropertyPanelInputType.Slider,
  label: 'Slider',
  value: 50,
  properties: {
    min: 10,
    max: 90,
    step: 5,
  },
};

export const Select = Template.bind({});
Select.args = {
  inputType: PropertyPanelInputType.Select,
  label: 'Select',
  value: 'first',
  properties: {
    options: [
      {
        label: 'First option',
        value: 'first',
      },
      {
        label: 'Second option',
        value: 'second',
      },
      {
        label: 'Disabled option',
        value: 'third',
        isDisabled: true,
      },
    ],
  },
};

export const TextRadio = Template.bind({});
TextRadio.args = {
  inputType: PropertyPanelInputType.TextRadio,
  label: 'Text radio',
  value: 'one',
  properties: {
    options: [
      {
        label: 'One',
        value: 'one',
      },
      {
        label: 'Two',
        value: 'two',
      },
      {
        label: 'Disabled',
        value: 'three',
        isDisabled: true,
      },
    ],
  },
};

export const IconRadio = Template.bind({});
IconRadio.args = {
  inputType: PropertyPanelInputType.IconRadio,
  label: 'Icon radio',
  value: 'left',
  properties: {
    options: [
      {
        icon: <AlignLeftIcon />,
        value: 'left',
      },
      {
        icon: <AlignCenterIcon />,
        value: 'center',
      },
      {
        icon: <AlignRightcon />,
        value: 'right',
        isDisabled: true,
      },
    ],
  },
};

export const Checkbox = Template.bind({});
Checkbox.args = {
  inputType: PropertyPanelInputType.Checkbox,
  label: 'Checkbox',
  value: true,
};

export const Button = Template.bind({});
Button.args = {
  inputType: PropertyPanelInputType.Button,
  label: 'Button',
  properties: {
    buttonLabel: 'Click me',
    onClick: () => alert('hello'),
  },
};
