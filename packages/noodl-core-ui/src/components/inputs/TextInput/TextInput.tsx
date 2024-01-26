import useCallAfterNextRender from '@noodl-hooks/useCallAfterNextRender';
import classNames from 'classnames';
import React, {
  ChangeEventHandler,
  MouseEventHandler,
  FocusEventHandler,
  useRef,
  useState,
  RefObject,
  useEffect,
  KeyboardEventHandler
} from 'react';
import { platform } from '@noodl/platform';

import { InputNotification, InputNotificationDisplayMode } from '@noodl-types/globalInputTypes';
import { FeedbackType } from '@noodl-constants/FeedbackType';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { SingleSlot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import { InputLabelSection } from '../InputLabelSection';
import { NotificationFeedbackDisplay } from '../NotificationFeedbackDisplay';
import { useNotificationFeedbackDisplay } from '../NotificationFeedbackDisplay/NotificationFeedbackDisplay.hooks';
import { useResizableInput } from './TextInput.hooks';
import css from './TextInput.module.scss';

export enum TextInputVariant {
  Default = 'is-variant-default',
  InModal = 'is-variant-in-modal',
  OpaqueOnHover = 'is-variant-opaque-on-hover',
  Transparent = 'is-variant-transparent'
}

type AllowedInputTypes =
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'search'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week';

/**
 * Read only is disabled but you can highlight (and copy) the text,
 * disabled is that you cannot interact with it at all.
 *
 *  TODO: Maybe the best is way to set ReadOnly, is if you set disabled and isCopyable,
 *        it is automatically set that it is possible to highlight the text
 */
export interface TextInputProps extends UnsafeStyleProps {
  value: string | number;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  type?: AllowedInputTypes;
  label?: string;
  variant?: TextInputVariant;

  notification?: InputNotification;

  hasBottomSpacing?: boolean;
  isReadonly?: boolean;
  isCopyable?: boolean;
  isDisabled?: boolean;
  isAutoFocus?: boolean;

  forwardedInputRef?: any;

  slotBeforeInput?: SingleSlot;
  slotAfterInput?: SingleSlot;

  onChange?: ChangeEventHandler<HTMLInputElement>;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onEnter?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onScrollbarCreated?: () => void;
  onScrollbarRemoved?: () => void;

  onRefChange?: (ref: RefObject<HTMLInputElement | null>) => void;

  testId?: string;

  UNSAFE_textClassName?: string;
  UNSAFE_textStyle?: React.CSSProperties;
}

export function TextInput({
  value,
  placeholder,
  prefix,
  suffix,
  type,
  notification,
  label,
  variant = TextInputVariant.Default,

  hasBottomSpacing,
  isReadonly,
  isCopyable,
  isDisabled,
  isAutoFocus,

  slotBeforeInput,
  slotAfterInput,

  forwardedInputRef,

  onChange,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onEnter,
  onKeyDown,
  onScrollbarCreated,
  onScrollbarRemoved,

  onRefChange,

  testId,

  UNSAFE_textClassName,
  UNSAFE_textStyle,
  UNSAFE_className,
  UNSAFE_style
}: TextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const { sizerContent, valueWidth } = useResizableInput({ value, placeholder, sizerRef });
  const [isFocused, setIsFocused] = useState(false);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  const [newNotification, updateNotification] = useNotificationFeedbackDisplay(notification);

  useEffect(() => {
    onRefChange && onRefChange(inputRef);
  }, [inputRef.current, onRefChange]);

  useEffect(() => {
    if (!inputRef.current || !forwardedInputRef) return;

    forwardedInputRef.current = inputRef.current;
  }, [forwardedInputRef, inputRef]);

  const doAfterNextRender = useCallAfterNextRender();

  useEffect(() => {
    doAfterNextRender(() => {
      if (!inputWrapperRef.current) return;

      if (inputWrapperRef.current.scrollWidth > inputWrapperRef.current.clientWidth) {
        setHasScrollbar(true);
      } else {
        setHasScrollbar(false);
      }
    });
  }, [value]);

  useEffect(() => {
    if (hasScrollbar) {
      onScrollbarCreated && onScrollbarCreated();
    } else {
      onScrollbarRemoved && onScrollbarRemoved();
    }
  }, [hasScrollbar]);

  function notifyReadOnlyField() {
    updateNotification({
      type: FeedbackType.Danger,
      displayMode: InputNotificationDisplayMode.FadeQuick,
      message: 'Read only value'
    });
  }

  function notifyOnCopySuccess() {
    updateNotification({
      type: FeedbackType.Success,
      displayMode: InputNotificationDisplayMode.FadeSlow,
      message: 'Copied!'
    });
  }

  function notifyOnCopyError() {
    updateNotification({
      type: FeedbackType.Danger,
      displayMode: InputNotificationDisplayMode.FadeSlow,
      message: 'Failed copying. Try doing it manually.'
    });
  }

  function handleChange(event) {
    if (isReadonly) {
      notifyReadOnlyField();
    } else {
      if (onChange) onChange(event);
      updateNotification(null);
    }
  }

  function focusInput() {
    if (!inputRef.current) return;

    inputRef.current.focus();
  }

  // Change the scroll direction to horizontal.
  function onScroll(event: React.WheelEvent<HTMLDivElement>) {
    if (inputWrapperRef.current) {
      inputWrapperRef.current.scrollLeft += event.deltaY + event.deltaX;
    }
  }

  return (
    <div
      className={classNames(
        css['Root'],
        hasBottomSpacing && css['has-bottom-spacing'],
        css[variant],
        suffix && css['has-suffix'],
        UNSAFE_className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={UNSAFE_style}
    >
      {label && <InputLabelSection label={label} />}

      <div
        className={classNames(
          css['InputArea'],
          isReadonly && css['is-readonly'],
          newNotification?.message && css['has-message'],
          isFocused && css['is-focused']
        )}
        onClick={() => focusInput()}
      >
        {!isReadonly && (
          <div className={classNames([css['Sizer'], css['TextStyle']])} ref={sizerRef}>
            {sizerContent}
          </div>
        )}

        {slotBeforeInput && <div className={css['BeforeContainer']}>{slotBeforeInput}</div>}

        <div
          ref={inputWrapperRef}
          onWheel={onScroll}
          className={classNames([
            css['InputWrapper'],
            sizerRef.current && css['is-scrollable'],
            isCopyable && css['has-button-spacing']
          ])}
        >
          <div className={css['InputWrapperInner']}>
            {prefix && <span className={classNames([css['Prefix'], css['TextStyle']])}>{prefix}</span>}

            {!isReadonly && (
              <input
                className={classNames([
                  css['Input'],
                  css['TextStyle'],
                  isReadonly && css['is-readonly'],
                  Boolean(suffix) && css['has-suffix'],
                  UNSAFE_textClassName
                ])}
                value={value}
                placeholder={placeholder}
                onChange={handleChange}
                onKeyDown={(e) => {
                  onKeyDown && onKeyDown(e);

                  if (e.key === 'Enter') {
                    onEnter && onEnter();
                    e.stopPropagation();
                  }
                }}
                onFocus={(e) => {
                  setIsFocused(true);
                  if (onFocus) onFocus(e);
                }}
                onBlur={(e) => {
                  setIsFocused(false);
                  if (onBlur) onBlur(e);
                }}
                disabled={isDisabled}
                type={type}
                style={
                  sizerRef.current
                    ? {
                        maxWidth: valueWidth,
                        flexBasis: valueWidth,
                        ...UNSAFE_textStyle
                      }
                    : UNSAFE_textStyle
                }
                ref={inputRef}
                data-test={testId}
                autoFocus={isAutoFocus}
              />
            )}

            {isReadonly && (
              <div
                className={classNames([
                  css['Input'],
                  css['TextStyle'],
                  isReadonly && css['is-readonly'],
                  css['is-div']
                ])}
                style={
                  sizerRef.current
                    ? {
                        minWidth: valueWidth,
                        flexBasis: valueWidth
                      }
                    : null
                }
                data-test={testId}
              >
                {value}
              </div>
            )}

            {suffix && <span className={classNames([css['Suffix'], css['TextStyle']])}>{suffix}</span>}
          </div>
        </div>

        {slotAfterInput && <div className={css['AfterContainer']}>{slotAfterInput}</div>}

        {isCopyable && (
          <div className={css['ButtonContainer']}>
            <IconButton
              icon={IconName.Copy}
              size={IconSize.Small}
              variant={IconButtonVariant.SemiTransparent}
              onClick={() => {
                platform.copyToClipboard(value.toString()).then(notifyOnCopySuccess).catch(notifyOnCopyError);
              }}
            />
          </div>
        )}

        {newNotification?.message && (
          <Text className={css['NotificationMessage']} textType={newNotification.type}>
            {newNotification.message}
          </Text>
        )}

        {newNotification && <NotificationFeedbackDisplay notification={newNotification} />}
      </div>
    </div>
  );
}
