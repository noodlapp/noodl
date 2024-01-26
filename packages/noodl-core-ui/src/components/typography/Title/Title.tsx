import { Slot } from '@noodl-core-ui/types/global';
import classNames from 'classnames';
import React from 'react';
import css from './Title.module.scss';

export enum TitleSize {
  Default = 'default',
  Large = 'large',
  Medium = 'medium',
  Small = 'small'
}

export enum TitleVariant {
  Default = 'default',
  Highlighted = 'highlighted',
  DefaultContrast = 'default-contrast',
  Danger = 'danger',
  Notice = 'notice',
  Success = 'success'
}

export interface TitleProps {
  children?: Slot;
  size?: TitleSize;
  variant?: TitleVariant;

  hasBottomSpacing?: boolean;
  isCentered?: boolean;
  isInline?: boolean;
}

export function Title({
  children,
  size = TitleSize.Default,
  variant = TitleVariant.Default,
  hasBottomSpacing,
  isCentered
}: TitleProps) {
  return (
    <h2
      className={classNames([
        css['Root'],
        css[`is-size-${size}`],
        css[`is-variant-${variant}`],
        isCentered && css['is-centered'],
        hasBottomSpacing && css['has-bottom-spacing']
      ])}
    >
      {children}
    </h2>
  );
}
