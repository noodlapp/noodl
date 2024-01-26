import classNames from 'classnames';
import React from 'react';

import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

export interface ColumnsProps extends UnsafeStyleProps {
  hasXGap?: number | boolean;
  hasYGap?: number | boolean;

  layoutString?: string | number;
  direction?: React.CSSProperties['flexDirection'];
  justifyContent?: React.CSSProperties['justifyContent'];

  children: Slot;
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

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

export function Columns({
  hasXGap,
  hasYGap,

  layoutString = '1 1',
  direction = 'row',
  justifyContent = 'flex-start',

  UNSAFE_style,
  UNSAFE_className,

  children
}: ColumnsProps) {
  if (!children) return null;
  let columnLayout = null;

  switch (typeof layoutString) {
    case 'string':
      columnLayout = layoutString.trim();
      break;

    case 'number':
      columnLayout = layoutString.toString().trim();
      break;

    default:
      columnLayout = null;
  }

  if (!columnLayout) {
    return <>{children}</>;
  }

  // all data for childrens width calculation
  const layout = columnLayout.split(' ').map((number) => parseInt(number));
  const totalFractions = layout.reduce((a, b) => a + b, 0);
  const fractionSize = 100 / totalFractions;
  const columnAmount = layout.length;

  const marginX = convert(hasXGap);
  const marginY = convert(hasYGap);

  return (
    <div
      className={classNames('columns-container', UNSAFE_className)}
      style={{
        ...UNSAFE_style,
        marginTop: `calc(${marginY} * -1)`,
        marginLeft: `calc(${marginX} * -1)`,
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: direction,
        width: `calc(100% + (${marginX})`,
        boxSizing: 'border-box',
        alignItems: 'stretch',
        justifyContent: justifyContent
      }}
    >
      {toArray(children).map((child, i) => {
        return (
          <div
            className="column-item"
            key={i}
            style={{
              boxSizing: 'border-box',
              paddingTop: marginY,
              paddingLeft: marginX,
              width: layout[i % columnAmount] * fractionSize + '%',
              flexShrink: 0,
              flexGrow: 0
            }}
          >
            {
              // @ts-expect-error
              React.cloneElement(child)
            }
          </div>
        );
      })}
    </div>
  );
}
