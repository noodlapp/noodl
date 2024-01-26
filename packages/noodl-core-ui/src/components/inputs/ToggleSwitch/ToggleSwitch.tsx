import { Label } from '@noodl-core-ui/components/typography/Label';
import classNames from 'classnames';
import React, { ChangeEventHandler } from 'react';
import css from './ToggleSwitch.module.scss';

export interface ToggleSwitchProps {
  value?: string;
  label?: string;
  isChecked?: boolean;
  isAlwaysActiveColor?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export function ToggleSwitch({
  value,
  label,
  isChecked,
  isAlwaysActiveColor,
  onChange
}: ToggleSwitchProps) {
  return (
    <div className={css['Root']}>
      {label && <Label>{label}</Label>}

      <label className={css['Track']}>
        <div
          className={classNames(
            css['Indicator'],
            isChecked && css['is-checked'],
            isAlwaysActiveColor && css['is-always-active-color']
          )}
        />

        <input
          className={css['Input']}
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
          value={value}
        />
      </label>
    </div>
  );
}
