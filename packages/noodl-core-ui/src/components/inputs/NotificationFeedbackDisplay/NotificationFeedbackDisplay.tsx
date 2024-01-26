import classNames from 'classnames';
import React from 'react';
import { InputNotification, InputNotificationDisplayMode } from '@noodl-types/globalInputTypes';
import css from './NotificationFeedbackDisplay.module.scss';

export interface NotificationFeedbackDisplayProps {
  notification: InputNotification;
}

export function NotificationFeedbackDisplay({ notification }: NotificationFeedbackDisplayProps) {
  if (!notification) return null;

  return (
    <div
      className={classNames([
        css['Root'],
        css[`is-type-${notification?.type}`],
        css[`is-display-mode-${notification?.displayMode || InputNotificationDisplayMode.Stay}`]
      ])}
    />
  );
}
