import classNames from 'classnames';
import React from 'react';

import css from './ActivityIndicator.module.scss';

export enum ActivityIndicatorColor {
  Light = 'light',
  Dark = 'dark'
}

export enum ActivityIndicatorSize {
  Default = 'default',
  Small = 'small'
}

export interface ActivityIndicatorProps {
  text?: string;
  color?: ActivityIndicatorColor;
  size?: ActivityIndicatorSize;
  isOverlay?: boolean;
}

export function ActivityIndicator({
  text,
  color = ActivityIndicatorColor.Light,
  size = ActivityIndicatorSize.Default,
  isOverlay
}: ActivityIndicatorProps) {
  return (
    <div className={classNames([css['Root'], isOverlay && css['is-overlay']])}>
      <div className={classNames(css['Inner'], css[`is-size-${size}`])}>
        {Boolean(text) && <p>{text}</p>}
        <div className={classNames([css['FirstDot'], css[`is-color-${color}`]])}></div>
        <div className={classNames([css['SecondDot'], css[`is-color-${color}`]])}></div>
        <div className={classNames([css['ThirdDot'], css[`is-color-${color}`]])}></div>
      </div>
    </div>
  );
}
