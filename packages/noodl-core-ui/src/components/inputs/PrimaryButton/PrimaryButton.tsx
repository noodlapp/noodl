import useParsedHref from '@noodl-hooks/useParsedHref';
import classNames from 'classnames';
import React, { FocusEventHandler, MouseEventHandler, useMemo } from 'react';
import { platform } from '@noodl/platform';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import { ActivityIndicator, ActivityIndicatorColor } from '../../common/ActivityIndicator';
import css from './PrimaryButton.module.scss';

export enum PrimaryButtonVariant {
  Cta = 'cta',
  Muted = 'muted',
  MutedOnLowBg = 'muted-on-low-bg',
  Ghost = 'ghost',
  Danger = 'danger'
}

export enum PrimaryButtonSize {
  Default = 'default',
  Small = 'small'
}

export interface PrimaryButtonProps extends UnsafeStyleProps {
  label: string;
  variant?: PrimaryButtonVariant;
  size?: PrimaryButtonSize;
  href?: string;
  icon?: IconName;

  isDisabled?: boolean;
  isLoading?: boolean;
  isFitContent?: boolean;
  isGrowing?: boolean;

  hasLeftSpacing?: boolean;
  hasRightSpacing?: boolean;
  hasBottomSpacing?: boolean;
  hasTopSpacing?: boolean;
  hasXSpacing?: boolean;

  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;

  testId?: string;
}

export function PrimaryButton({
  label,
  variant = PrimaryButtonVariant.Cta,
  size = PrimaryButtonSize.Default,
  href,
  icon,

  isDisabled,
  isLoading,
  isFitContent,
  isGrowing,

  hasLeftSpacing,
  hasRightSpacing,
  hasBottomSpacing,
  hasTopSpacing,
  hasXSpacing,

  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,

  testId,

  UNSAFE_className,
  UNSAFE_style
}: PrimaryButtonProps) {
  const activityColor = useMemo(() => {
    switch (variant) {
      case PrimaryButtonVariant.Cta:
        return ActivityIndicatorColor.Dark;
      case PrimaryButtonVariant.Muted:
        return ActivityIndicatorColor.Light;
      case PrimaryButtonVariant.Danger:
        return ActivityIndicatorColor.Dark;
      default:
        return ActivityIndicatorColor.Dark;
    }
  }, [variant]);

  const parsedHref = useParsedHref(href);

  return (
    <button
      className={classNames([
        css['Root'],
        (hasXSpacing || hasLeftSpacing) && css['has-left-spacing'],
        (hasXSpacing || hasRightSpacing) && css['has-right-spacing'],
        hasBottomSpacing && css['has-bottom-spacing'],
        hasTopSpacing && css['has-top-spacing'],
        isFitContent && css['is-fit-content'],
        isGrowing && css['is-growing'],
        css[`is-variant-${variant}`],
        css[`is-size-${size}`],
        UNSAFE_className
      ])}
      onClick={(e) => {
        if (isLoading) return;
        if (parsedHref) platform.openExternal(parsedHref);
        if (onClick) onClick(e);
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={isDisabled}
      data-test={testId}
      style={UNSAFE_style}
    >
      <span className={classNames([css['Label'], isLoading && css['is-loading']])}>
        {icon && (
          <Icon
            icon={icon}
            size={size === PrimaryButtonSize.Small ? IconSize.Small : undefined}
            UNSAFE_className={css['Icon']}
          />
        )}
        {label}
      </span>
      <div className={classNames([css['Spinner'], isLoading && css['is-loading']])}>
        <ActivityIndicator color={activityColor} />
      </div>
    </button>
  );
}
