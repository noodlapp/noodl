import React, { useEffect, useState } from 'react';

import RadioButtonContext from '../../../contexts/radiobuttoncontext';
import Layout from '../../../layout';
import { Noodl, Slot } from '../../../types';

export interface RadioButtonGroupProps extends Noodl.ReactProps {
  name: string;
  value: string;

  valueChanged?: (value: string) => void;

  children: Slot;
}

export function RadioButtonGroup(props: RadioButtonGroupProps) {
  const [selected, setSelected] = useState(props.value);
  const context = {
    selected: selected,
    name: props.name,
    checkedChanged: (value) => {
      setSelected(value);
      props.valueChanged && props.valueChanged(value);
    }
  };

  useEffect(() => {
    setSelected(props.value);
  }, [props.value]);

  const style: React.CSSProperties = { ...props.style };
  Layout.size(style, props);
  Layout.align(style, props);

  let className = 'ndl-controls-radiobuttongroup';
  if (props.className) className = className + ' ' + props.className;

  return (
    <RadioButtonContext.Provider value={context}>
      <div className={className} style={style}>
        {props.children}
      </div>
    </RadioButtonContext.Provider>
  );
}
