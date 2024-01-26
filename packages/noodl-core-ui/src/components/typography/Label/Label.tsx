import classNames from 'classnames';
import React from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';

import { TextType } from '@noodl-core-ui/components/typography/Text';
import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './Label.module.scss';

export enum LabelSize {
  Small = 'is-size-small',
  Default = 'is-size-default',
  Medium = 'is-size-medium',
  Big = 'is-size-big'
}

export enum LabelSpacingSize {
  Small = 'small',
  Default = 'default',
  Large = 'large'
}

export interface LabelProps extends UnsafeStyleProps {
  children: Slot;
  size?: LabelSize;
  variant?: TextType | FeedbackType;
  hasBottomSpacing?: boolean | LabelSpacingSize;
  hasLeftSpacing?: boolean | LabelSpacingSize;
  hasRightSpacing?: boolean | LabelSpacingSize;
  hasTopSpacing?: boolean | LabelSpacingSize;
  isInline?: boolean;
  hasTextWrap?: boolean;
}

export function Label({
  children,
  size = LabelSize.Default,
  variant = TextType.Default,
  hasBottomSpacing,
  hasLeftSpacing,
  hasTopSpacing,
  hasRightSpacing,
  isInline,
  hasTextWrap,
  UNSAFE_className,
  UNSAFE_style
}: LabelProps) {
  return (
    <span
      style={UNSAFE_style}
      className={classNames(
        css['Root'],
        css[`is-variant-${variant}`],
        css[size],
        hasBottomSpacing && css[`has-bottom-spacing-${getSpacing(hasBottomSpacing, size)}`],
        hasLeftSpacing && css[`has-left-spacing-${getSpacing(hasLeftSpacing, size)}`],
        hasTopSpacing && css[`has-top-spacing-${getSpacing(hasTopSpacing, size)}`],
        hasRightSpacing && css[`has-right-spacing-${getSpacing(hasRightSpacing, size)}`],
        isInline && css['is-inline'],
        hasTextWrap && css['has-text-wrap'],
        UNSAFE_className
      )}
    >
      {children}
    </span>
  );
}

function getSpacing(hasSpacing, size) {
  if (hasSpacing === true) {
    switch (size) {
      case LabelSize.Small:
        return LabelSpacingSize.Small;

      default:
        return LabelSpacingSize.Default;
    }
  } else {
    return hasSpacing;
  }
}
