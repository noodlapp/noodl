import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';
import classNames from 'classnames';
import React from 'react';
import css from './Container.module.scss';

export enum ContainerDirection {
  Horizontal = 'horizontal',
  Vertical = 'vertical'
}

export interface ContainerProps extends UnsafeStyleProps {
  direction?: ContainerDirection;

  hasLeftSpacing?: boolean;
  hasRightSpacing?: boolean;
  hasTopSpacing?: boolean;
  hasBottomSpacing?: boolean;
  hasXSpacing?: boolean;
  hasYSpacing?: boolean;

  isFill?: boolean;
  hasSpaceBetween?: boolean;

  children?: Slot;
}

export function Container({
  direction = ContainerDirection.Horizontal,

  hasLeftSpacing,
  hasRightSpacing,
  hasTopSpacing,
  hasBottomSpacing,
  hasXSpacing,
  hasYSpacing,

  isFill,
  hasSpaceBetween,

  UNSAFE_style,
  UNSAFE_className,

  children
}: ContainerProps) {
  return (
    <div
      className={classNames([
        css['Root'],
        css[`is-direction-${direction}`],
        (hasXSpacing || hasLeftSpacing) && css['has-left-spacing'],
        (hasXSpacing || hasRightSpacing) && css['has-right-spacing'],
        (hasYSpacing || hasTopSpacing) && css['has-top-spacing'],
        (hasYSpacing || hasBottomSpacing) && css['has-bottom-spacing'],
        isFill && css['is-fill'],
        hasSpaceBetween && css['has-space-between'],
        UNSAFE_className
      ])}
      style={UNSAFE_style}
    >
      {children}
    </div>
  );
}
