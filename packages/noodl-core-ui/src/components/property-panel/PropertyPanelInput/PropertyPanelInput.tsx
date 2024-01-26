import classNames from 'classnames';
import React, { useMemo } from 'react';

import { PropertyPanelBaseInputProps } from '@noodl-core-ui/components/property-panel/PropertyPanelBaseInput';
import { PropertyPanelButton } from '@noodl-core-ui/components/property-panel/PropertyPanelButton';
import { PropertyPanelCheckbox } from '@noodl-core-ui/components/property-panel/PropertyPanelCheckbox';
import { PropertyPanelIconRadioInput } from '@noodl-core-ui/components/property-panel/PropertyPanelIconRadioInput';
import { PropertyPanelLengthUnitInput } from '@noodl-core-ui/components/property-panel/PropertyPanelLengthUnitInput';
import { PropertyPanelNumberInput } from '@noodl-core-ui/components/property-panel/PropertyPanelNumberInput';
import { PropertyPanelSelectInput } from '@noodl-core-ui/components/property-panel/PropertyPanelSelectInput';
import { PropertyPanelSliderInput } from '@noodl-core-ui/components/property-panel/PropertyPanelSliderInput';
import { PropertyPanelTextInput } from '@noodl-core-ui/components/property-panel/PropertyPanelTextInput';
import { PropertyPanelTextRadioInput } from '@noodl-core-ui/components/property-panel/PropertyPanelTextRadioInput';
import { Slot } from '@noodl-core-ui/types/global';

import css from './PropertyPanelInput.module.scss';

export enum PropertyPanelInputType {
  Text = 'text',
  Number = 'number',
  LengthUnit = 'length-unit',
  Slider = 'slider',
  Select = 'select',
  Color = 'color',
  TextRadio = 'text-radio',
  IconRadio = 'icon-radio',
  Checkbox = 'checkbox',
  Button = 'button'

  // MarginPadding = 'margin-padding',
  // SizeMode = 'size-mode',
}

export interface PropertyPanelInputProps extends Omit<PropertyPanelBaseInputProps, 'type'> {
  label: string;
  inputType: PropertyPanelInputType;
  properties: TSFixme;
}

export function PropertyPanelInput({
  label,
  value,
  inputType = PropertyPanelInputType.Text,
  properties,
  isChanged,
  isConnected,
  onChange
}: PropertyPanelInputProps) {
  const Input = useMemo(() => {
    switch (inputType) {
      case PropertyPanelInputType.Text:
        return PropertyPanelTextInput;
      case PropertyPanelInputType.Number:
        return PropertyPanelNumberInput;
      case PropertyPanelInputType.LengthUnit:
        return PropertyPanelLengthUnitInput;
      case PropertyPanelInputType.Select:
        return PropertyPanelSelectInput;
      case PropertyPanelInputType.Slider:
        return PropertyPanelSliderInput;
      case PropertyPanelInputType.TextRadio:
        return PropertyPanelTextRadioInput;
      case PropertyPanelInputType.IconRadio:
        return PropertyPanelIconRadioInput;
      case PropertyPanelInputType.Checkbox:
        return PropertyPanelCheckbox;
      case PropertyPanelInputType.Button:
        return PropertyPanelButton;
    }
  }, [inputType]);

  return (
    <div className={css['Root']}>
      <div className={classNames(css['Label'], isChanged && css['is-changed'])}>{label}</div>
      <div className={css['InputContainer']}>
        {
          // FIXME: fix below ts-ignore with better typing
          // this is caused by PropertyPanelBaseInputProps having a generic for "value"
          // i want to pass a boolan to the checkbox value that will be used in checked for a better API

          <Input
            // @ts-expect-error
            value={value}
            // @ts-expect-error
            onChange={onChange}
            // @ts-expect-error
            isChanged={isChanged}
            // @ts-expect-error
            isConnected={isConnected}
            // @ts-expect-error
            properties={properties}
          />
        }
      </div>
    </div>
  );
}

export interface PropertyPanelRowProps {
  isChanged?: boolean;
  label: string;
  children: Slot;
}

export function PropertyPanelRow({ isChanged, label, children }: PropertyPanelRowProps) {
  return (
    <div className={css['Root']}>
      <div className={classNames(css['Label'], isChanged && css['is-changed'])}>{label}</div>
      <div className={css['InputContainer']}>{children}</div>
    </div>
  );
}
