import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';
import classNames from 'classnames';
import React from 'react';
import css from './Box.module.scss';

export interface BoxProps extends UnsafeStyleProps {
  hasLeftSpacing?: number | boolean;
  hasRightSpacing?: number | boolean;
  hasTopSpacing?: number | boolean;
  hasBottomSpacing?: number | boolean;

  hasXSpacing?: number | boolean;
  hasYSpacing?: number | boolean;

  children?: Slot;
}

export function Box({
  hasLeftSpacing,
  hasRightSpacing,
  hasTopSpacing,
  hasBottomSpacing,
  hasXSpacing,
  hasYSpacing,

  UNSAFE_style,
  UNSAFE_className,

  children
}: BoxProps) {
  const style = {
    ...UNSAFE_style
  };

  function convert(...values: (boolean | number)[]): string {
    for (const value of values) {
      if (typeof value === 'boolean' && value) {
        return '16px';
      }

      if (typeof value === 'number') {
        return value * 4 + 'px';
      }
    }

    return undefined;
  }

  if (hasXSpacing || hasLeftSpacing) {
    style.paddingLeft = convert(hasLeftSpacing, hasXSpacing);
  }

  if (hasXSpacing || hasRightSpacing) {
    style.paddingRight = convert(hasRightSpacing, hasXSpacing);
  }

  if (hasYSpacing || hasTopSpacing) {
    style.paddingTop = convert(hasTopSpacing, hasYSpacing);
  }

  if (hasYSpacing || hasBottomSpacing) {
    style.paddingBottom = convert(hasBottomSpacing, hasYSpacing);
  }

  return (
    <div className={classNames([css['Root'], UNSAFE_className])} style={style}>
      {children}
    </div>
  );
}
