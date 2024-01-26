import classNames from 'classnames';
import React, { ChangeEventHandler, cloneElement, FocusEventHandler, MouseEventHandler } from 'react';

import { InputNotification } from '@noodl-types/globalInputTypes';

import { ReactComponent as CheckmarkIcon } from '@noodl-core-ui/assets/icons/checkmark.svg';
import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import { InputLabelSection } from '../InputLabelSection';
import { NotificationFeedbackDisplay } from '../NotificationFeedbackDisplay';
import { useNotificationFeedbackDisplay } from '../NotificationFeedbackDisplay/NotificationFeedbackDisplay.hooks';
import css from './Checkbox.module.scss';

export enum CheckboxVariant {
  Default = 'default',
  Sidebar = 'sidebar',
  Light = 'light'
}

export enum CheckboxSize {
  Small = 'small',
  Large = 'large'
}

export interface CheckboxProps extends UnsafeStyleProps {
  variant?: CheckboxVariant;

  label?: string;
  value?: string | number;
  children?: Slot;
  checkboxSize?: CheckboxSize;
  notification?: InputNotification;

  hasHiddenCheckbox?: boolean;
  hasBottomSpacing?: boolean;

  onChange?: ChangeEventHandler<HTMLInputElement>;
  onMouseEnter?: MouseEventHandler<HTMLLabelElement>;
  onMouseLeave?: MouseEventHandler<HTMLLabelElement>;
  onFocus?: FocusEventHandler<HTMLLabelElement>;
  onBlur?: FocusEventHandler<HTMLLabelElement>;

  isChecked?: boolean;
  isDisabled?: boolean;

  testId?: string;
}

export function Checkbox({
  variant = CheckboxVariant.Default,

  label,
  value,
  children,
  checkboxSize = CheckboxSize.Small,
  notification,

  hasHiddenCheckbox,
  hasBottomSpacing,

  onChange,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,

  isChecked,
  isDisabled,

  testId,

  UNSAFE_className,
  UNSAFE_style
}: CheckboxProps) {
  const [newNotification, setNewNotification] = useNotificationFeedbackDisplay(notification);

  return (
    <label
      className={classNames([
        css['Root'],
        css[`is-variant-${variant}`],
        isDisabled && css['is-disabled'],
        hasBottomSpacing && css['has-bottom-spacing'],
        UNSAFE_className
      ])}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      data-test={testId}
      style={UNSAFE_style}
    >
      <NotificationFeedbackDisplay notification={newNotification} />

      <input
        className={css['Checkbox']}
        type="checkbox"
        checked={isChecked}
        disabled={isDisabled}
        onChange={onChange}
        value={value}
      />

      {!hasHiddenCheckbox && (
        <div
          className={classNames([
            css['FauxCheckbox'],
            css[`is-size-${checkboxSize}`],
            Boolean(label) && css['has-right-margin']
          ])}
        >
          {isChecked && <CheckmarkIcon />}
        </div>
      )}

      {children && <div className={css['ChildContainer']}>{cloneElement(children as TSFixme, { isChecked })}</div>}
      {label && <InputLabelSection label={label} />}
    </label>
  );
}
