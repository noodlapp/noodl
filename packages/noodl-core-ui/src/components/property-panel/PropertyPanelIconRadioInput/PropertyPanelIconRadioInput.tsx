import classNames from 'classnames';
import React, { useMemo } from 'react';

import { PropertyPanelBaseInputProps } from '@noodl-core-ui/components/property-panel/PropertyPanelBaseInput';
import { SingleSlot } from '@noodl-core-ui/types/global';

import css from './PropertyPanelIconRadioInput.module.scss';

export enum PropertyPanelIconRadioSize {
  Default = 'default',
  Large = 'large'
}
interface PropertyPanelIconRadioProperties {
  name: string;
  options: {
    icon: SingleSlot;
    value: string | number;
    isDisabled?: boolean;
  }[];
}

export interface PropertyPanelIconRadioInputProps extends Omit<PropertyPanelBaseInputProps, 'type' | 'onClick'> {
  onChange?: (value: string | number) => void;
  properties?: PropertyPanelIconRadioProperties;
}

export function PropertyPanelIconRadioInput({ value, properties, onChange }: PropertyPanelIconRadioInputProps) {
  const timestamp = useMemo(() => Date.now().toString(), []);

  return (
    <div className={css['Root']}>
      {properties?.options.map((option) => (
        <label
          className={classNames(
            css['Option'],
            value === option.value && css['is-selected'],
            option.isDisabled && css['is-disabled']
          )}
        >
          <input
            className={css['Input']}
            type="radio"
            name={timestamp}
            value={option.value}
            checked={value === option.value}
            onClick={() => onChange && onChange(option.value)}
            disabled={option.isDisabled}
          />
          {option.icon}
        </label>
      ))}
    </div>
  );
}
