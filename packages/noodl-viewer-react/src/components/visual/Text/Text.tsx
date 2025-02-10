import React from 'react';

import Layout from '../../../layout';
import PointerListeners from '../../../pointerlisteners';
import { Noodl } from '../../../types';

export interface TextProps extends Noodl.ReactProps {
  as?: keyof JSX.IntrinsicElements | React.ComponentType<unknown>;

  attrs: React.Attributes;

  textStyle: Noodl.TextStyle;
  text: string;

  sizeMode?: Noodl.SizeMode;
  width?: string;
  height?: string;
  fixedWidth?: boolean;
  fixedHeight?: boolean;

  // Extra Attributes
  dom: Record<string, unknown>;
}

export function Text(props: TextProps) {
  const { as: Component = 'div' } = props;

  const style = {
    ...props.textStyle,
    ...props.style
  };

  Layout.size(style, props);
  Layout.align(style, props);

  style.color = props.noodlNode.context.styles.resolveColor(style.color);

  // Respect '\n' in the string
  if (props.sizeMode === 'contentSize' || props.sizeMode === 'contentWidth') {
    style.whiteSpace = 'pre';
  } else {
    style.whiteSpace = 'pre-wrap';
    style.overflowWrap = 'anywhere';
  }

  if (style.opacity === 0) {
    style.pointerEvents = 'none';
  }

  return (
    <Component
      className={['ndl-visual-text', props.className].join(' ')}
      {...props.attrs}
      {...props.dom}
      {...PointerListeners(props)}
      style={style}
    >
      {String(props.text)}
    </Component>
  );
}
