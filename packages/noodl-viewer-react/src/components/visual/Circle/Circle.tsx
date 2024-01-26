import React from 'react';

import Layout from '../../../layout';
import PointerListeners from '../../../pointerlisteners';
import { Noodl } from '../../../types';

export interface CircleProps extends Noodl.ReactProps {
  size: number;
  startAngle: number;
  endAngle: number;

  fillEnabled: boolean;
  fillColor: Noodl.Color;

  strokeEnabled: boolean;
  strokeColor: Noodl.Color;
  strokeWidth: number;
  strokeLineCap: 'butt' | 'round';

  dom;
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function filledArc(x, y, radius, startAngle, endAngle) {
  if (endAngle % 360 === startAngle % 360) {
    endAngle -= 0.0001;
  }

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    arcSweep,
    0,
    end.x,
    end.y,
    'L',
    x,
    y,
    'L',
    start.x,
    start.y
  ].join(' ');
}

function arc(x, y, radius, startAngle, endAngle) {
  if (endAngle % 360 === startAngle % 360) {
    endAngle -= 0.0001;
  }

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

  return ['M', start.x, start.y, 'A', radius, radius, 0, arcSweep, 0, end.x, end.y].join(' ');
}

export class Circle extends React.Component<CircleProps> {
  constructor(props: CircleProps) {
    super(props);
  }

  render() {
    //SVG can only do strokes centered on a path, and we want to render it inside.
    //We'll do it manually by adding another path on top of the filled circle

    let fill;
    let stroke;

    const r = this.props.size / 2;
    const { startAngle, endAngle } = this.props;

    if (this.props.fillEnabled) {
      const r = this.props.size / 2;
      fill = <path d={filledArc(r, r, r, startAngle, endAngle)} fill={this.props.fillColor} />;
    }

    if (this.props.strokeEnabled) {
      const { strokeColor, strokeWidth, strokeLineCap } = this.props;
      const strokeRadius = r - this.props.strokeWidth / 2;
      const path = arc(r, r, strokeRadius, startAngle, endAngle);
      stroke = (
        <path
          d={path}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap={strokeLineCap}
        />
      );
    }

    const style = { ...this.props.style };
    Layout.size(style, this.props);
    Layout.align(style, this.props);

    if (style.opacity === 0) {
      style.pointerEvents = 'none';
    }

    //the SVG element lack some properties like offsetLeft, offsetTop that the drag node depends on.
    //Let's wrap it in a div to make it work properly
    return (
      <div className={this.props.className} {...this.props.dom} {...PointerListeners(this.props)} style={style}>
        <svg xmlns="http://www.w3.org/2000/svg" width={this.props.size} height={this.props.size}>
          {fill}
          {stroke}
        </svg>
      </div>
    );
  }
}
