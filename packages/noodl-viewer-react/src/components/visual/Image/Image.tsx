import React from 'react';

import Layout from '../../../layout';
import PointerListeners from '../../../pointerlisteners';
import { Noodl } from '../../../types';

export interface ImageProps extends Noodl.ReactProps {
  dom: {
    alt?: string;
    src: string;
    onLoad?: () => void;
  };
}

export function Image(props: ImageProps) {
  const style = { ...props.style };

  Layout.size(style, props);
  Layout.align(style, props);

  if (style.opacity === 0) {
    style.pointerEvents = 'none';
  }

  if (props.dom?.src?.startsWith('/')) {
    // @ts-expect-error missing Noodl typings
    const baseUrl = Noodl.Env['BaseUrl'];
    if (baseUrl) {
      props.dom.src = baseUrl + props.dom.src.substring(1);
    }
  }

  return <img className={props.className} {...props.dom} {...PointerListeners(props)} style={style} />;
}
