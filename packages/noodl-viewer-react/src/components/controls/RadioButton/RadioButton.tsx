import React, { useContext } from 'react';

import RadioButtonContext from '../../../contexts/radiobuttoncontext';
import Layout from '../../../layout';
import Utils from '../../../nodes/controls/utils';
import { Noodl } from '../../../types';

export interface RadioButtonProps extends Noodl.ReactProps {
  id: string;
  enabled: boolean;
  value: string;

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

  fillSpacing: string;

  checkedChanged: (value: boolean) => void;
}

function isPercentage(size /* string */) {
  return size && size[size.length - 1] === '%';
}

export function RadioButton(props: RadioButtonProps) {
  const radioButtonGroup = useContext(RadioButtonContext);

  const style = { ...props.style };

  if (props.parentLayout === 'none') {
    style.position = 'absolute';
  }

  Layout.align(style, props);

  props.checkedChanged && props.checkedChanged(radioButtonGroup ? radioButtonGroup.selected === props.value : false);

  const inputProps = {
    ...props.attrs,
    id: props.id,
    disabled: !props.enabled,
    className: [props.className, 'ndl-controls-radio-2'].join(' '),
    style: {
      width: props.styles.radio.width,
      height: props.styles.radio.height
    }
  };

  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
    ...props.styles.radio
  };

  if (props.useLabel) {
    if (isPercentage(props.styles.radio.width)) {
      delete inputWrapperStyle.width;
      inputWrapperStyle.flexGrow = 1;
    }
  } else {
    Object.assign(inputProps, Utils.controlEvents(props));
    Object.assign(inputWrapperStyle, style);
  }

  function _renderIcon() {
    if (props.iconSourceType === 'image' && props.iconImageSource !== undefined)
      return <img alt="" src={props.iconImageSource} style={{ width: props.iconSize, height: props.iconSize }} />;
    else if (props.iconSourceType === 'icon' && props.iconIconSource !== undefined) {
      const style = { fontSize: props.iconSize, color: props.iconColor };
      if (props.iconIconSource.codeAsClass === true) {
        return (
          <span
            className={['ndl-controls-abs-center', props.iconIconSource.class, props.iconIconSource.code].join(' ')}
            style={style}
          ></span>
        );
      } else {
        return (
          <span className={['ndl-controls-abs-center', props.iconIconSource.class].join(' ')} style={style}>
            {props.iconIconSource.code}
          </span>
        );
      }
    }

    return null;
  }

  const fillStyle: React.CSSProperties = {
    left: props.fillSpacing,
    right: props.fillSpacing,
    top: props.fillSpacing,
    bottom: props.fillSpacing,
    backgroundColor: props.styles.fill.backgroundColor,
    borderRadius: 'inherit',
    position: 'absolute'
  };

  const radioButton = (
    <div className="ndl-controls-pointer" style={inputWrapperStyle} noodl-style-tag="radio">
      <div style={fillStyle} noodl-style-tag="fill" />
      {props.useIcon ? _renderIcon() : null}
      <input
        type="radio"
        name={radioButtonGroup ? radioButtonGroup.name : undefined}
        {...inputProps}
        checked={radioButtonGroup ? radioButtonGroup.selected === props.value : false}
        onChange={(e) => {
          radioButtonGroup && radioButtonGroup.checkedChanged && radioButtonGroup.checkedChanged(props.value);
        }}
      />
    </div>
  );

  if (props.useLabel) {
    const labelStyle = {
      marginLeft: props.labelSpacing,
      ...props.labeltextStyle,
      ...props.styles.label,
      cursor: props.enabled ? undefined : 'default'
    };

    labelStyle.color = props.noodlNode.context.styles.resolveColor(labelStyle.color);

    const wrapperStyle = { display: 'flex', alignItems: 'center', ...style };
    if (isPercentage(props.styles.radio.width)) {
      wrapperStyle.width = props.styles.radio.width;
    }
    if (isPercentage(props.styles.radio.height)) {
      wrapperStyle.height = props.styles.radio.height;
    }

    return (
      <div style={wrapperStyle} {...Utils.controlEvents(props)}>
        {radioButton}
        <label className="ndl-controls-pointer" style={labelStyle} htmlFor={props.id} noodl-style-tag="label">
          {props.label}
        </label>
      </div>
    );
  } else {
    return radioButton;
  }
}
