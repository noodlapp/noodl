import classNames from 'classnames';
import React, { useMemo } from 'react';

import { PropertyPanelBaseInputProps } from '@noodl-core-ui/components/property-panel/PropertyPanelBaseInput';

import css from './PropertyPanelTextRadioInput.module.scss';

interface PropertyPanelTextRadioProperties {
  name: string;
  options: {
    label: string;
    value: string | number;
    isDisabled?: boolean;
  }[];
}

export interface PropertyPanelTextRadioInputProps extends Omit<PropertyPanelBaseInputProps, 'type' | 'onClick'> {
  onChange: (value: string | number) => void;
  properties?: PropertyPanelTextRadioProperties;
}

export function PropertyPanelTextRadioInput({ value, properties, onChange }: PropertyPanelTextRadioInputProps) {
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
            onClick={() => onChange(option.value)}
            disabled={option.isDisabled}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
