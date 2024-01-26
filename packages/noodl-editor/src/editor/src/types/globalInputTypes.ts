import { FeedbackType } from '@noodl-constants/FeedbackType';

export enum InputNotificationDisplayMode {
  Stay = 'stay',
  FadeQuick = 'fade-quick',
  FadeSlow = 'fade-slow'
}

export interface InputNotification {
  type: FeedbackType;
  message?: string;
  displayMode?: InputNotificationDisplayMode;
}
