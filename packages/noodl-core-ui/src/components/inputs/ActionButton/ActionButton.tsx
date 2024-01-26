import classNames from 'classnames';
import React, { FocusEventHandler, MouseEventHandler, useMemo } from 'react';

import { ActivityIndicator } from '@noodl-core-ui/components/common/ActivityIndicator';
import { Icon, IconName, IconVariant } from '@noodl-core-ui/components/common/Icon';
import { TextType } from '@noodl-core-ui/components/typography/Text';
import { Slot } from '@noodl-core-ui/types/global';

import css from './ActionButton.module.scss';

export enum ActionButtonVariant {
  Default = 'default',
  Secondary = 'secondary',
  OnBg2 = 'on-bg-2',
  /** CallToAction is when the user __can__ act, but it is doing something. */
  CallToAction = 'user-action',
  Background = 'background',
  /** BackgroundAction is when the user __can't__ act */
  BackgroundAction = 'background-action',
  Proud = 'proud'
}

export interface ActionButtonProps {
  variant?: ActionButtonVariant;
  icon?: IconName;
  affixIcon?: IconName;

  prefixText?: string;
  label: string | Slot;
  affixText?: string;

  hasTopDivider?: boolean;
  isDisabled?: boolean;
  isInactive?: boolean;

  hasNoBottomBorder?: boolean;

  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;

  testId?: string;
}

export function ActionButton({
  variant = ActionButtonVariant.Default,
  icon = IconName.Refresh,
  affixIcon,

  prefixText,
  label,
  affixText,

  hasTopDivider,
  isDisabled = false,
  hasNoBottomBorder,
  isInactive,

  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,

  testId
}: ActionButtonProps) {
  const iconVariant: IconVariant = useMemo(() => {
    switch (variant) {
      default:
        return TextType.Default;
      case ActionButtonVariant.CallToAction:
        return TextType.Shy;
    }
  }, [variant]);

  return (
    <button
      className={classNames([
        css['Root'],
        css[`is-variant-${variant}`],
        hasNoBottomBorder && css['has-no-bottom-border'],
        isInactive && css['is-inactive'],
        hasTopDivider && css['has-top-divider']
      ])}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={isDisabled}
      data-test={testId}
    >
      <div className={classNames(css['Container'])}>
        <div className={classNames(css['Icon'], isDisabled && css['is-disabled'])}>
          <Icon icon={icon} />
        </div>
        <div className={classNames(css['Text'], isDisabled && css['is-disabled'])}>
          {Boolean(prefixText) && <small className={css['Label']}>{prefixText}</small>}
          {Boolean(typeof label === 'string') ? <p className={css['Label']}>{label}</p> : label}
          {Boolean(affixText) && <small className={css['Label']}>{affixText}</small>}
        </div>
        {Boolean(affixIcon) && (
          <div className={classNames(css['Icon'], isDisabled && css['is-disabled'])}>
            <Icon icon={affixIcon} variant={iconVariant} />
          </div>
        )}
      </div>
      {variant === ActionButtonVariant.BackgroundAction && <ActivityIndicator />}
    </button>
  );
}
