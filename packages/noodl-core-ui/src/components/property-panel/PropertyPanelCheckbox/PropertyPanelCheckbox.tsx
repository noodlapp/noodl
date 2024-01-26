import classNames from 'classnames';
import React from 'react';

import { PropertyPanelBaseInputProps } from '@noodl-core-ui/components/property-panel/PropertyPanelBaseInput';

import { ReactComponent as CheckmarkIcon } from '../../../assets/icons/checkmark.svg';
import css from './PropertyPanelCheckbox.module.scss';

export interface PropertyPanelCheckboxProps extends Omit<PropertyPanelBaseInputProps<boolean>, 'type'> {}

export function PropertyPanelCheckbox({ value, onChange, isConnected, isChanged }: PropertyPanelCheckboxProps) {
  return (
    <div className={css['Root']}>
      <input
        type="checkbox"
        checked={value}
        value={null} // TODO: a bit ugly
        className={css['Checkbox']}
        onChange={() => onChange(!value)}
      />

      <div
        className={classNames(css['FauxCheckbox'], isChanged && css['is-changed'], isConnected && css['is-connected'])}
      >
        {value && <CheckmarkIcon />}
      </div>
    </div>
  );
}
