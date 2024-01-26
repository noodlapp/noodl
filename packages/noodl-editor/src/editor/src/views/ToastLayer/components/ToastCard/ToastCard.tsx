import classNames from 'classnames';
import React from 'react';

import { ActivityIndicator, ActivityIndicatorColor } from '@noodl-core-ui/components/common/ActivityIndicator';
import { LegacyIconButton, LegacyIconButtonIcon } from '@noodl-core-ui/components/inputs/LegacyIconButton';

import css from './ToastCard.module.scss';

export enum ToastType {
  Neutral = 'is-neutral',
  Success = 'is-success',
  Danger = 'is-danger',
  Pending = 'is-pending'
}

export interface ToastProps {
  message: string;
  type?: ToastType;
  progress?: number;
  hasActivity?: boolean;
  onClose?: () => void;
}

export function ToastCard({ message, type = ToastType.Neutral, progress, hasActivity, onClose }: ToastProps) {
  return (
    <div className={classNames(css['Root'], css[type])}>
      <span className={css['Message']}>{message}</span>

      {typeof progress !== 'undefined' && <div className={css['ProgressBar']} style={{ width: `${progress}%` }} />}
      <div className={css['IndicatorContainer']}>
        {hasActivity && <ActivityIndicator color={ActivityIndicatorColor.Dark} />}
        {onClose && <LegacyIconButton icon={LegacyIconButtonIcon.CloseDark} onClick={onClose} />}
      </div>
    </div>
  );
}
