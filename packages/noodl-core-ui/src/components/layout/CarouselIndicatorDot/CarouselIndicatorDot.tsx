import classNames from 'classnames';
import React from 'react';

import { CarouselIndicatorBaseProps } from '@noodl-core-ui/components/layout/Carousel/Carousel';

import css from './CarouselIndicatorDot.module.scss';

export interface CarouselIndicatorDotProps extends CarouselIndicatorBaseProps {}

export function CarouselIndicatorDot({ isActive, onClick }: CarouselIndicatorDotProps) {
  return <div className={classNames([css['Root'], isActive && css['is-active']])} onClick={onClick}></div>;
}
