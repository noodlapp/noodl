import useTimeout from '@noodl-hooks/useTimeout';
import classNames from 'classnames';
import React, { CSSProperties, useEffect, useState } from 'react';

import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import { ActivityIndicator } from '../../common/ActivityIndicator';
import css from './ConditionalContainer.module.scss';

export enum LoaderType {
  Block = 'block',
  Inline = 'inline'
}

export interface ConditionalContainerProps extends UnsafeStyleProps {
  doRenderWhen: boolean;
  isLoaderHidden?: boolean;
  loaderType?: LoaderType;
  children: Slot;
  loaderStyle?: CSSProperties;
  loaderVisibilityDelayMs?: number | null;

  UNSAFE_root_className?: string;
  UNSAFE_root_style?: React.CSSProperties;
}

export function ConditionalContainer({
  doRenderWhen,
  isLoaderHidden,
  loaderType = LoaderType.Block,
  children,
  loaderStyle,
  loaderVisibilityDelayMs = 1500,
  UNSAFE_root_className,
  UNSAFE_root_style,
  UNSAFE_className,
  UNSAFE_style
}: ConditionalContainerProps) {
  const [isTimeoutCleared, setIsTimeoutCleared] = useState(false);
  const [isLoaderRendered, setIsLoaderRendered] = useState(Boolean(loaderVisibilityDelayMs) ? false : true);

  useTimeout(
    () => {
      setIsLoaderRendered(true);
    },
    isTimeoutCleared ? null : loaderVisibilityDelayMs
  );

  useEffect(() => {
    if (!doRenderWhen) {
      setIsTimeoutCleared(false);
      setIsLoaderRendered(true);
    } else {
      setIsLoaderRendered(false);
      setIsTimeoutCleared(true);
    }
  }, [doRenderWhen]);

  useEffect(() => {
    if (!isLoaderHidden) return;

    setIsLoaderRendered(false);
    setIsTimeoutCleared(true);
  }, [isLoaderHidden]);

  return (
    <div className={classNames(css['Root'], UNSAFE_root_className)} style={UNSAFE_root_style}>
      {doRenderWhen && children}
      {isLoaderRendered && !doRenderWhen && (
        <div style={loaderStyle} className={classNames([css['Loader'], css[`is-loader-type-${loaderType}`]])}>
          <div className={classNames(css['LoaderInner'], UNSAFE_className)} style={UNSAFE_style}>
            <ActivityIndicator />
          </div>
        </div>
      )}
    </div>
  );
}
