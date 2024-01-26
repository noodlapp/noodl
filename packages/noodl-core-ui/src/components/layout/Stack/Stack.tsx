import classNames from 'classnames';
import React from 'react';

import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './Stack.module.scss';

function convertSpacing(options: { default: string }, ...values: (boolean | number)[]): string {
  for (const value of values) {
    if (typeof value === 'boolean' && value) {
      return options.default;
    }

    if (typeof value === 'number') {
      return value * 4 + 'px';
    }
  }

  return undefined;
}

export interface StackProps extends UnsafeStyleProps {
  direction: React.CSSProperties['flexDirection'];
  hasSpacing?: boolean | number;
  children?: Slot;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ direction, hasSpacing, UNSAFE_style, UNSAFE_className, children }: StackProps, ref) => {
    const style: React.CSSProperties = {
      ...UNSAFE_style,
      flexDirection: direction
    };

    if (direction === 'column') {
      if (!style.width) style.width = '100%';
    } else if (direction === 'row') {
      if (!style.height) style.height = '100%';
    }

    if (hasSpacing) {
      style.gap = convertSpacing({ default: '16px' }, hasSpacing);
    }

    return (
      <div ref={ref} className={classNames([css['Root'], UNSAFE_className])} style={style}>
        {children}
      </div>
    );
  }
);

export type HStackProps = Omit<StackProps, 'direction'>;
export const HStack = React.forwardRef<HTMLDivElement, HStackProps>((props: HStackProps, ref) => {
  return <Stack ref={ref} {...props} direction="row" />;
});

export type VStackProps = Omit<StackProps, 'direction'>;
export const VStack = React.forwardRef<HTMLDivElement, VStackProps>((props: VStackProps, ref) => {
  return <Stack ref={ref} {...props} direction="column" />;
});
