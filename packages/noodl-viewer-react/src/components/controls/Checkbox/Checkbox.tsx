import React, { useEffect, useState } from 'react';

import Layout from '../../../layout';
import Utils from '../../../nodes/controls/utils';
import { Noodl } from '../../../types';

export interface CheckboxProps extends Noodl.ReactProps {
  id: string;
  enabled: boolean;
  checked: boolean;

  attrs: React.Attributes;

  useLabel: boolean;
  label: string;
  labelSpacing: string;
  labeltextStyle: Noodl.TextStyle;

  useIcon: boolean;
  iconPlacement: 'left' | 'right';
  iconSpacing: string;
  iconSourceType: 'image' | 'icon';
  iconImageSource: Noodl.Image;
  iconIconSource: Noodl.Icon;
  iconSize: string;
  iconColor: Noodl.Color;

  checkedChanged: (checked: boolean) => void;
}

export function Checkbox(props: CheckboxProps) {
  const [checked, setChecked] = useState(props.checked);

  // Report initial values when mounted
  useEffect(() => {
    setChecked(!!props.checked);
  }, []);

  useEffect(() => {
    setChecked(!!props.checked);
  }, [props.checked]);

  const style: React.CSSProperties = { ...props.style };

  if (props.parentLayout === 'none') {
    style.position = 'absolute';
  }

  Layout.align(style, props);

  const inputProps = {
    ...props.attrs,
    id: props.id,
    className: [props.className, 'ndl-controls-checkbox-2'].join(' '),
    disabled: !props.enabled,
    style: {
      width: props.styles.checkbox.width,
      height: props.styles.checkbox.height
    }
  };

  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
    ...props.styles.checkbox
  };

  if (!props.useLabel) {
    Object.assign(inputProps, Utils.controlEvents(props));
    Object.assign(inputWrapperStyle, style);
  }

  function _renderIcon() {
    if (props.iconSourceType === 'image' && props.iconImageSource !== undefined)
      return (
        <img
          alt=""
          src={props.iconImageSource}
          style={{
            width: props.iconSize,
            height: props.iconSize,
            position: 'absolute'
          }}
        />
      );
    else if (props.iconSourceType === 'icon' && props.iconIconSource !== undefined) {
      const style: React.CSSProperties = {
        fontSize: props.iconSize,
        color: props.iconColor,
        position: 'absolute'
      };

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

  const checkbox = (
    <div className="ndl-controls-pointer" style={inputWrapperStyle} noodl-style-tag="checkbox">
      {props.useIcon ? _renderIcon() : null}
      <input
        type="checkbox"
        {...inputProps}
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          props.checkedChanged && props.checkedChanged(e.target.checked);
        }}
      />
    </div>
  );

  if (props.useLabel) {
    const labelStyle: React.CSSProperties = {
      marginLeft: props.labelSpacing,
      ...props.labeltextStyle,
      ...props.styles.label
    };

    if (!props.enabled) {
      labelStyle.cursor = 'default';
    }

    labelStyle.color = props.noodlNode.context.styles.resolveColor(labelStyle.color);

    return (
      <div style={{ display: 'flex', alignItems: 'center', ...style }} {...Utils.controlEvents(props)}>
        {checkbox}
        <label className="ndl-controls-pointer" style={labelStyle} htmlFor={props.id} noodl-style-tag="label">
          {props.label}
        </label>
      </div>
    );
  } else {
    return checkbox;
  }
}
