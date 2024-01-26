import { useEffect } from '@storybook/addons';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import React, { useState } from 'react';

import { PropertyPanelSection } from '@noodl-core-ui/components/property-panel/PropertyPanelSection';

import { PropertyPanelMarginPadding } from './PropertyPanelMarginPadding';

export default {
  title: 'Property Panel/Margin Padding',
  component: PropertyPanelMarginPadding,
  argTypes: {}
} as ComponentMeta<typeof PropertyPanelMarginPadding>;

const Template: ComponentStory<typeof PropertyPanelMarginPadding> = (args) => {
  const [values, setValues] = useState({
    padding: { top: '10px', bottom: '10px', left: '10px', right: '10px' },
    margin: { top: '10px', bottom: '10px', left: '10px', right: '10px' }
  });

  useEffect(() => {
    console.log(values);
  }, [values]);

  function handleChange(value, type, direction) {
    const newValues = { ...values };

    newValues[type][direction] = value;

    setValues(newValues);
  }

  return (
    <div style={{ width: 280 }}>
      <PropertyPanelSection title="Margin and padding">
        <PropertyPanelMarginPadding {...args} values={values} onChange={setValues} />
      </PropertyPanelSection>

      <div style={{ paddingTop: 30 }}>
        Top padding:
        <br />
        <input value={values.padding.top} onChange={(e) => handleChange(e.target.value, 'padding', 'top')} />
        <br />
        <br />
        Bottom padding:
        <br />
        <input value={values.padding.bottom} onChange={(e) => handleChange(e.target.value, 'padding', 'bottom')} />
        <br />
        <br />
        Left padding:
        <br />
        <input value={values.padding.left} onChange={(e) => handleChange(e.target.value, 'padding', 'left')} />
        <br />
        <br />
        Right padding:
        <br />
        <input value={values.padding.right} onChange={(e) => handleChange(e.target.value, 'padding', 'right')} />
        <br />
        <br />
        Top margin:
        <br />
        <input value={values.margin.top} onChange={(e) => handleChange(e.target.value, 'margin', 'top')} />
        <br />
        <br />
        Bottom margin:
        <br />
        <input value={values.margin.bottom} onChange={(e) => handleChange(e.target.value, 'margin', 'bottom')} />
        <br />
        <br />
        Left margin:
        <br />
        <input value={values.margin.left} onChange={(e) => handleChange(e.target.value, 'margin', 'left')} />
        <br />
        <br />
        Right margin:
        <br />
        <input value={values.margin.right} onChange={(e) => handleChange(e.target.value, 'margin', 'right')} />
        <br />
        <br />
      </div>
    </div>
  );
};

export const Common = Template.bind({});
Common.args = {};
