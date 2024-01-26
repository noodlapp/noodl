import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import classNames from 'classnames';
import css from './GitHistoryItem.module.scss';

import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { VStack } from '@noodl-core-ui/components/layout/Stack';

export enum BranchColor {
  Remote = 'remote',
  Remote_Ahead = 'remote_ahead',
  Local = 'local'
}

export interface HistoryItemBranch {
  bottom: boolean;
  circle: boolean;

  topColor?: BranchColor;
  color: BranchColor;

  isHead: boolean;
  top: boolean;
  x: number;
  branchPoints?: {
    x: number;
    color: string;
  }[];
}

export interface BranchVizItemProps {
  branches: HistoryItemBranch[];
}

export function BranchVizItem({ branches }: BranchVizItemProps) {
  const [svgHeight, setSvgHeight] = useState(0);

  const svgRef = useRef(null);
  useEffect(() => {
    //some SVG parameters only work with absolute pixel positions, so track the height of the parent so we can
    //make the SVG graphic responsive
    const resizeObserver = new ResizeObserver((entries) => {
      setSvgHeight(entries[0].borderBoxSize[0].blockSize + 1); //add one pixel so we render over the list item divider
    });

    resizeObserver.observe(svgRef.current.parentNode);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  //set height synchronously to avoid first frame flicker
  useLayoutEffect(() => {
    setSvgHeight(svgRef.current.parentNode.getBoundingClientRect().height);
  }, []);

  const cy = svgHeight / 2;
  const leftPadding = 18; //enough room to render the largest circle without clipping
  const curveRadius = 8;

  return (
    <svg ref={svgRef} strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      {branches.map((b, i) => {
        const x = b.x + leftPadding;
        return (
          <React.Fragment key={i}>
            <g className={classNames(css['Branch'], css[`is-variant-${b.color}`])}>
              {b.top && (
                <line
                  className={classNames(css['BranchTop'], css[`is-variant-${b.topColor}`])}
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={cy}
                />
              )}

              {b.bottom && <line x1={x} x2={x} y1={cy} y2={svgHeight} />}

              {Boolean(b.branchPoints) &&
                b.branchPoints.map((bp, i) => (
                  <path
                    key={i}
                    stroke={bp.color}
                    fill="none"
                    d={`M${x} ${cy} L${bp.x + leftPadding - curveRadius} ${cy} Q${
                      bp.x + leftPadding
                    } ${cy} ${bp.x + leftPadding} ${cy - curveRadius} L${bp.x + leftPadding} 0`}
                  />
                ))}

              {b.isHead && <circle className={css['Head']} cx={x} cy={cy} r="14" opacity="0.3" />}

              {b.circle && (
                <circle
                  className={classNames([css['Circle'], b.isHead && css['is-head']])}
                  cx={x}
                  cy={cy}
                  r="7"
                />
              )}
            </g>
          </React.Fragment>
        );
      })}
    </svg>
  );
}

export interface GitHistoryItemProps extends UnsafeStyleProps {
  branches: HistoryItemBranch[];

  hasAction?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;

  children: Slot;

  isSelected?: boolean;
}

export function GitHistoryItem({
  branches,

  hasAction,
  onClick,

  isSelected,

  children,

  UNSAFE_className,
  UNSAFE_style
}: GitHistoryItemProps) {
  const isFirstCommit = branches?.every((x) => !x.bottom);
  return (
    <div
      className={classNames([
        css['Root'],
        Boolean(hasAction) && css['can-selected'],
        isSelected && css['is-selected'],
        isFirstCommit && css['is-first-commit'],
        UNSAFE_className
      ])}
      style={UNSAFE_style}
      onClick={onClick}
    >
      <div className={classNames([css['Item']])}>
        <BranchVizItem branches={branches} />
      </div>
      <VStack>
        <Box hasYSpacing={3}>{children}</Box>
      </VStack>
    </div>
  );
}
