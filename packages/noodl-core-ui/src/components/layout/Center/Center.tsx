import classNames from 'classnames';
import React from 'react';

import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './Center.module.scss';

export interface CenterProps extends UnsafeStyleProps {
  children: Slot;
}

export const Center = React.forwardRef<HTMLDivElement, CenterProps>(
  ({ children, UNSAFE_className, UNSAFE_style }: CenterProps, ref) => {
    return (
      <div ref={ref} className={classNames(css['Root'], UNSAFE_className)} style={UNSAFE_style}>
        {children}
      </div>
    );
  }
);
