import classNames from 'classnames';
import React from 'react';

import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './AiIconAnimated.module.scss';

export interface AiIconAnimatedProps extends UnsafeStyleProps {
  isListening?: boolean;
  isDimmed?: boolean;
}

export function AiIconAnimated({ isListening, isDimmed, UNSAFE_className, UNSAFE_style }: AiIconAnimatedProps) {
  return (
    <div
      className={classNames(css.Root, isListening && css.__isListening, isDimmed && css.__isDimmed, UNSAFE_className)}
      style={UNSAFE_style}
    >
      <div className={css.HeroLogoWrapper}>
        <div className={css.HeroLogo}>
          <span>Ai</span>

          <div className={css.LogoIdleCircleContainer}>
            <div className={css.LogoIdleCircleInner}>
              <div className={css.LogoIdleCircle} />
            </div>
          </div>

          <div className={css.LogoLoader}>
            <div className={css.LogoLoaderInner}>
              <div className={css.Circle1}>
                <span className={css.SpinningBalls}></span>
              </div>

              <div className={css.Circle2}>
                <span className={css.SpinningBalls}></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
