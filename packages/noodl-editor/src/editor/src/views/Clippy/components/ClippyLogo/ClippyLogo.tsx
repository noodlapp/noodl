import classNames from 'classnames';
import React from 'react';

import css from './ClippyLogo.module.scss';

interface ClippyLogoProps {
  isListening?: boolean;
  isThinking?: boolean;
  isDimmed?: boolean;
}

export function ClippyLogo({ isListening, isDimmed, isThinking }: ClippyLogoProps) {
  return (
    <div
      className={classNames(
        css.Root,
        isListening && css.__isListening,
        isDimmed && css.__isDimmed,
        isThinking && css.__isThinking
      )}
    >
      <div className={css.HeroLogoWrapper}>
        <div className={css.HeroLogo}>
          <span>Ai</span>

          <div className={css.LogoIdleCircleContainer}>
            <div className={css.LogoIdleCircleInner}>
              <div className={css.LogoIdleCircle} />
            </div>
          </div>

          <div className={css.LogoListeningCircleContainer}>
            <div className={css.LogoListeningCircleInner}>
              <div className={css.LogoListeningCircle} />
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
