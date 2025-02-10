import React, { useRef, useState, useEffect } from 'react';

import { ForEachComponent } from '../../../nodes/std-library/data/foreach';
import { Noodl, Slot } from '../../../types';

export interface ColumnsProps extends Noodl.ReactProps {
  marginX: string;
  marginY: string;

  attrs: React.Attributes;

  justifyContent: 'flex-start' | 'flex-end' | 'center';
  direction: 'row' | 'column';
  minWidth: string;
  layoutString: string;

  children: Slot;
}

function calcAutofold(layout, minWidths, containerWidth, marginX) {
  const first = _calcAutofold(layout, minWidths, containerWidth, marginX);
  const second = _calcAutofold(first.layout, minWidths, containerWidth, marginX);

  if (first.totalFractions === second.totalFractions) {
    return first;
  } else {
    return calcAutofold(second.layout, minWidths, containerWidth, marginX);
  }
}

function _calcAutofold(layout, minWidth, containerWidth, marginX) {
  const totalFractions = layout.reduce((a, b) => a + b, 0);
  const fractionSize = 100 / totalFractions;

  const rowWidth = layout.reduce(
    (acc, curr, i) => {
      return {
        expected: acc.expected + (fractionSize / 100) * containerWidth * curr,
        min: acc.min + parseFloat(minWidth) + marginX
      };
    },
    { expected: 0, min: 0, max: null }
  );

  const newLayout = layout;

  if (rowWidth.expected < rowWidth.min) {
    newLayout.pop();
  }

  const newTotalFractions = newLayout.reduce((a, b) => a + b, 0);
  const newFractionSize = 100 / newTotalFractions;
  const newColumnAmount = newLayout.length;

  return {
    layout: newLayout,
    totalFractions: newTotalFractions,
    fractionSize: newFractionSize,
    columnAmount: newColumnAmount
  };
}

export function Columns(props: ColumnsProps) {
  if (!props.children) return null;
  let columnLayout = null;

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(null);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const container = containerRef.current;
      if (!container) return;
      setContainerWidth(container.offsetWidth);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  switch (typeof props.layoutString) {
    case 'string':
      columnLayout = props.layoutString.trim();
      break;

    case 'number':
      columnLayout = String(props.layoutString).trim();
      break;

    default:
      columnLayout = null;
  }

  if (!columnLayout) {
    return <>{props.children}</>;
  }

  // all data for childrens width calculation
  const targetLayout = columnLayout.split(' ').map((number) => parseInt(number));

  // constraints
  const { layout, columnAmount, fractionSize } = calcAutofold(
    targetLayout,
    props.minWidth,
    containerWidth,
    props.marginX
  );

  let children = [];
  let forEachComponent = null;

  // ForEachCompoent breaks the layout but is needed to send onMount/onUnmount
  if (!Array.isArray(props.children)) {
    // @ts-expect-error props.children.type is any
    if (props.children.type !== ForEachComponent) {
      children = [props.children]
    }
  } else {
    children = props.children.filter((child) => child.type !== ForEachComponent);
    forEachComponent = props.children.find((child) => child.type === ForEachComponent);
  }

  return (
    <div
      {...props.attrs}
      className={['columns-container', props.className].join(' ')}
      ref={containerRef}
      style={{
        visibility: containerWidth === null ? "hidden" : "visible",
        marginTop: parseFloat(props.marginY) * -1,
        marginLeft: parseFloat(props.marginX) * -1,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        justifyContent: props.justifyContent,
        flexDirection: props.direction,
        width: `calc(100% + (${parseFloat(props.marginX)}px)`,
        boxSizing: 'border-box',
        ...props.style
      }}
    >
      {forEachComponent && forEachComponent}

      {children.map((child, i) => {
        return (
          <div
            className="column-item"
            key={i}
            style={{
              boxSizing: 'border-box',
              paddingTop: props.marginY,
              paddingLeft: props.marginX,
              width: layout[i % columnAmount] * fractionSize + '%',
              flexShrink: 0,
              flexGrow: 0,
              minWidth: props.minWidth
              // maxWidths needs some more thought
              //maxWidth: getMinMaxInputValues(maxWidths, columnAmount, props.marginX, i)
            }}
          >
            {React.cloneElement(child)}
          </div>
        );
      })}
    </div>
  );
}
