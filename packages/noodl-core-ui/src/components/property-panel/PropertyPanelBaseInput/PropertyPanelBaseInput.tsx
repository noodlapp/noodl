import classNames from 'classnames';
import React, { FocusEventHandler, KeyboardEventHandler, MouseEventHandler } from 'react';

import css from './PropertyPanelBaseInput.module.scss';

export interface PropertyPanelBaseInputProps<ValueType = string | number> {
  value: ValueType;
  type: string;

  isChanged?: boolean;
  isConnected?: boolean;
  isFauxFocused?: boolean;
  hasHiddenCaret?: boolean;
  hasSmallText?: boolean;

  onChange?: (value: ValueType) => void;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  onKeyDown?: KeyboardEventHandler;
  onError?: (error: Error) => void;

  className?: string;
}

export function PropertyPanelBaseInput({
  value,
  type,

  isChanged,
  isConnected,
  isFauxFocused,
  hasHiddenCaret,
  hasSmallText,

  onChange,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onKeyDown,

  className
}: PropertyPanelBaseInputProps) {
  return (
    <input
      className={classNames(
        css['Root'],
        isChanged && css['is-changed'],
        isConnected && css['is-connected'],
        hasHiddenCaret && css['has-hidden-caret'],
        isFauxFocused && css['is-faux-focused'],
        hasSmallText && css['has-small-text']
      )}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
}
