import classNames from 'classnames';
import React, { ChangeEventHandler, FocusEventHandler, MouseEventHandler } from 'react';

import { InputNotification } from '@noodl-types/globalInputTypes';

import { Text } from '@noodl-core-ui/components//typography/Text';
import { InputLabelSection } from '@noodl-core-ui/components/inputs/InputLabelSection';
import { NotificationFeedbackDisplay } from '@noodl-core-ui/components/inputs/NotificationFeedbackDisplay';
import { useNotificationFeedbackDisplay } from '@noodl-core-ui/components/inputs/NotificationFeedbackDisplay/NotificationFeedbackDisplay.hooks';
import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './TextArea.module.scss';

export interface TextAreaProps extends UnsafeStyleProps {
  value?: string;
  placeholder?: string;
  label?: string;

  minLength?: number;
  maxLength?: number;

  notification?: InputNotification;

  isDisabled?: boolean;
  hasBottomSpacing?: boolean;
  isResizeDisabled?: boolean;
  isAutoFocus?: boolean;

  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onFocus?: FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  /** Occurs when Shift+Enter is pressed. */
  onEnter?: () => void;
}

export function TextArea({
  value,
  placeholder,
  label,

  minLength,
  maxLength,

  notification,

  isDisabled,
  hasBottomSpacing,
  isResizeDisabled,
  isAutoFocus,

  onChange,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onEnter,

  UNSAFE_className,
  UNSAFE_style
}: TextAreaProps) {
  const [newNotification, _updateNotification] = useNotificationFeedbackDisplay(notification);

  const isEmpty = !(typeof value === 'string' && value.length > 0);

  return (
    <div className={classNames(css['Root'], hasBottomSpacing && css['has-bottom-spacing'])}>
      {label && <InputLabelSection label={label} />}

      <div
        className={classNames(
          css['InputArea'],
          isDisabled && css['is-disabled'],
          newNotification?.message && css['has-message']
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <textarea
          className={classNames(
            css['Input'],
            isResizeDisabled && css['is-resize-disabled'],
            onChange && isEmpty && css['is-empty'],
            UNSAFE_className
          )}
          style={UNSAFE_style}
          minLength={minLength}
          maxLength={maxLength}
          disabled={isDisabled}
          placeholder={placeholder}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(ev) => {
            if (onEnter && ev.shiftKey && ev.key === 'Enter') {
              onEnter();
              ev.preventDefault();
            }
          }}
          value={value}
          autoFocus={isAutoFocus}
        />

        {newNotification && <NotificationFeedbackDisplay notification={newNotification} />}
      </div>

      {newNotification?.message && (
        <Text className={css['NotificationMessage']} textType={newNotification.type}>
          {newNotification.message}
        </Text>
      )}
    </div>
  );
}
