import React, { useEffect, useState } from 'react';

import Layout from '../../../layout';
import Utils from '../../../nodes/controls/utils';
import { Noodl } from '../../../types';

export interface SliderProps extends Noodl.ReactProps {
  _nodeId: string;
  id: string;
  enabled: boolean;

  attrs: React.Attributes;

  value: number;
  min: number;
  max: number;
  step: number;

  thumbHeight: string;
  thumbWidth: string;
  thumbColor: string;

  trackHeight: string;
  trackActiveColor: string;
  trackColor: string;

  onClick: () => void;
  updateOutputValue: (value: number) => void;
}

function _styleTemplate(_class: string, props: SliderProps) {
  return `.${_class}::-webkit-slider-thumb {
  width: ${props.thumbWidth};
}`;
}

function setBorderStyle(style: React.CSSProperties, prefix: string, props: SliderProps) {
  function setBorder(style: React.CSSProperties, group: string) {
    const width = `${prefix}Border${group}Width`;
    const color = `${prefix}Border${group}Color`;
    const borderStyle = `${prefix}Border${group}Style`;

    const w = props[width] || props[`${prefix}BorderWidth`];
    if (w !== undefined) style[`border${group}Width`] = w;

    const c = (style[color] = props[color] || props[`${prefix}BorderColor`]);
    if (c !== undefined) style[`border${group}Color`] = c;

    const s = props[borderStyle] || props[`${prefix}BorderStyle`];
    if (s !== undefined) style[`border${group}Style`] = s;
  }

  setBorder(style, 'Top');
  setBorder(style, 'Right');
  setBorder(style, 'Bottom');
  setBorder(style, 'Left');
}

function setBorderRadius(style: React.CSSProperties, prefix: string, props: SliderProps) {
  const radius = props[`${prefix}BorderRadius`];
  const tl = props[`${prefix}BorderTopLeftRadius`] || radius;
  const tr = props[`${prefix}BorderTopRightRadius`] || radius;
  const br = props[`${prefix}BorderBottomRightRadius`] || radius;
  const bl = props[`${prefix}BorderBottomLeftRadius`] || radius;

  style.borderRadius = `${tl} ${tr} ${br} ${bl}`;
}

function setShadow(style: React.CSSProperties, prefix: string, props: SliderProps) {
  if (!props[`${prefix}BoxShadowEnabled`]) return;

  const inset = props[`${prefix}BoxShadowInset`];
  const x = props[`${prefix}BoxShadowOffsetX`];
  const y = props[`${prefix}BoxShadowOffsetY`];
  const blur = props[`${prefix}BoxShadowBlurRadius`];
  const spread = props[`${prefix}BoxShadowSpreadRadius`];
  const color = props[`${prefix}BoxShadowColor`];

  style.boxShadow = `${inset ? 'inset ' : ''}${x} ${y} ${blur} ${spread} ${color}`;
}

function hasUnitPx(value: string) {
  return value && value[value.length - 1] === 'x';
}

export function Slider(props: SliderProps) {
  const [value, setValue] = useState(props.value);

  useEffect(() => {
    onValueChanged(props.value);
  }, [props.value]);

  function onValueChanged(value: number) {
    setValue(value);
    props.updateOutputValue(value);
  }

  const style: React.CSSProperties = { ...props.style };
  Layout.size(style, props);
  Layout.align(style, props);

  const instanceClassId = 'ndl-controls-range-' + props._nodeId;
  Utils.updateStylesForClass(instanceClassId, props, _styleTemplate);

  const className = `ndl-controls-range2 ${instanceClassId} ${props.className ? props.className : ''} `;

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    ...props.attrs,
    id: props.id,
    style: {
      width: '100%',
      opacity: 0
    },
    onClick: props.onClick,
    min: props.min,
    max: props.max
  };

  if (props.step) {
    inputProps.step = props.step;
  }

  //make the input as tall as the tallest element, track or thumb, so the entire area becomes interactive
  //Makes it possible to design sliders with thin tracks and tall thumbs

  if (hasUnitPx(props.thumbHeight)) {
    if (hasUnitPx(props.trackHeight)) {
      const thumbHeight = Number(props.thumbHeight.slice(0, -2));
      const trackHeight = Number(props.trackHeight.slice(0, -2));
      inputProps.style.height = Math.max(thumbHeight, trackHeight) + 'px';
    } else {
      inputProps.style.height = props.thumbHeight;
    }
  } else {
    inputProps.style.height = props.trackHeight;
  }

  const divStyle = {
    display: 'flex',
    alignItems: 'center',
    ...style
  };

  const valueFactor = (value - props.min) / (props.max - props.min);

  const trackStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: props.trackHeight,
    background: `linear-gradient(to right, ${props.trackActiveColor} 0%, ${props.trackActiveColor} ${
      valueFactor * 100
    }%, ${props.trackColor} ${valueFactor * 100}%, ${props.trackColor} 100%)`
  };

  setBorderStyle(trackStyle, 'track', props);
  setBorderRadius(trackStyle, 'track', props);
  setShadow(trackStyle, 'track', props);

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    left: 'calc((100% - ' + props.thumbWidth + ') * ' + valueFactor + ')',
    width: props.thumbWidth,
    height: props.thumbHeight,
    backgroundColor: props.thumbColor
  };

  setBorderStyle(thumbStyle, 'thumb', props);
  setBorderRadius(thumbStyle, 'thumb', props);
  setShadow(thumbStyle, 'thumb', props);

  return (
    <div style={divStyle}>
      <div style={trackStyle} />
      <div style={thumbStyle} />
      <input
        className={className}
        {...Utils.controlEvents(props)}
        type="range"
        {...inputProps}
        value={value}
        disabled={!props.enabled}
        onChange={(e) => onValueChanged(Number(e.target.value))}
      />
    </div>
  );
}
