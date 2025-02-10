import React, { useEffect, useState } from 'react';

import type { TSFixme } from '../../../../typings/global';
import Layout from '../../../layout';
import Utils from '../../../nodes/controls/utils';
import { Noodl } from '../../../types';

export interface SelectProps extends Noodl.ReactProps {
  id: string;
  value: string;
  enabled: boolean;
  textStyle: Noodl.TextStyle;
  items: TSFixme;

  attrs: React.Attributes;

  placeholder: string;
  placeholderOpacity: string;

  useIcon: boolean;
  iconPlacement: 'left' | 'right';
  iconSpacing: string;
  iconSourceType: 'image' | 'icon';
  iconImageSource: Noodl.Image;
  iconIconSource: Noodl.Icon;
  iconSize: string;
  iconColor: Noodl.Color;

  useLabel: boolean;
  label: string;
  labelSpacing: string;
  labeltextStyle: Noodl.TextStyle;

  onClick: () => void;
  valueChanged: (value: string) => void;
}

export function Select(props: SelectProps) {
  const [value, setValue] = useState(props.value);

  useEffect(() => {
    setValue(props.value);
    props.valueChanged(props.value);
  }, [props.value, props.items]);

  let style = { ...props.style };
  Layout.size(style, props);
  Layout.align(style, props);

  if (props.textStyle !== undefined) {
    // Apply text style
    style = Object.assign({}, props.textStyle, style);
    style.color = props.noodlNode.context.styles.resolveColor(style.color);
  }

  // Hide label if there is no selected value, of if value is not in the items array
  const selectedIndex = !props.items || value === undefined ? -1 : props.items.findIndex((i) => i.Value === value);

  const { height, ...otherStyles } = style;

  function _renderIcon() {
    if (props.iconSourceType === 'image' && props.iconImageSource !== undefined)
      return <img alt="" src={props.iconImageSource} style={{ width: props.iconSize, height: props.iconSize }}></img>;
    else if (props.iconSourceType === 'icon' && props.iconIconSource !== undefined) {
      const style: React.CSSProperties = { fontSize: props.iconSize, color: props.iconColor };
      if (props.iconPlacement === 'left' || props.iconPlacement === undefined) style.marginRight = props.iconSpacing;
      else style.marginLeft = props.iconSpacing;

      if (props.iconIconSource.codeAsClass === true) {
        return (
          <span className={[props.iconIconSource.class, props.iconIconSource.code].join(' ')} style={style}></span>
        );
      } else {
        return (
          <span className={props.iconIconSource.class} style={style}>
            {props.iconIconSource.code}
          </span>
        );
      }
    }

    return null;
  }

  const inputProps = {
    ...props.attrs,
    id: props.id,
    className: props.className,
    style: {
      inset: 0,
      opacity: 0,
      position: 'absolute',
      textTransform: 'inherit',
      cursor: props.enabled ? '' : 'default',
      '-webkit-appearance': 'none' //this makes styling possible on Safari, otherwise the size will be incorrect as it will use the native styling
    },
    onClick: props.onClick
  };

  const inputWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    ...props.styles.inputWrapper,
    cursor: props.enabled ? '' : 'default'
  };

  const heightInPercent = height && height[String(height).length - 1] === '%';

  if (props.useLabel) {
    if (heightInPercent) {
      inputWrapperStyle.flexGrow = 1;
    } else {
      inputWrapperStyle.height = height;
    }
  } else {
    Object.assign(inputWrapperStyle, otherStyles);
    inputWrapperStyle.height = height;
  }

  let options = [];

  if (props.items) {
    options = props.items.map((i) => (
      <option key={i.Value} value={i.Value} disabled={i.Disabled === 'true' || i.Disabled === true ? true : undefined}>
        {i.Label}
      </option>
    ));
    // options.unshift();
  }

  let label = null;

  if (selectedIndex >= 0 && selectedIndex < props.items.items.length) {
    label = <span>{props.items.items[selectedIndex].Label}</span>;
  } else if (props.placeholder) {
    label = <span style={{ opacity: props.placeholderOpacity }}>{props.placeholder}</span>;
  }

  //A hidden first option is preselected and added to the list of options, it makes it possible to select the first item in the dropdown
  const inputWrapper = (
    <div className="ndl-controls-pointer" style={inputWrapperStyle} noodl-style-tag="inputWrapper">
      {props.useIcon && props.iconPlacement === 'left' ? _renderIcon() : null}
      <div
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          display: 'flex'
        }}
      >
        {label}
      </div>
      {props.useIcon && props.iconPlacement === 'right' ? _renderIcon() : null}
      <select
        {...inputProps}
        disabled={!props.enabled}
        value={options.find((i) => i.props.value === value) ? value : undefined}
        {...Utils.controlEvents(props)}
        onChange={(e) => {
          setValue(e.target.value);
          props.valueChanged && props.valueChanged(e.target.value);
        }}
      >
        <option value="" disabled selected hidden />
        {options}
      </select>
    </div>
  );

  if (props.useLabel) {
    const outerWrapperStyle: React.CSSProperties = {
      ...otherStyles,
      display: 'flex',
      flexDirection: 'column'
    };

    if (heightInPercent) {
      outerWrapperStyle.height = height;
    }

    return (
      <div style={outerWrapperStyle}>
        <label
          htmlFor={props.id}
          style={{
            ...props.labeltextStyle,
            ...props.styles.label,
            marginBottom: props.labelSpacing
          }}
          noodl-style-tag="label"
        >
          {props.label}
        </label>
        {inputWrapper}
      </div>
    );
  } else {
    return inputWrapper;
  }
}
