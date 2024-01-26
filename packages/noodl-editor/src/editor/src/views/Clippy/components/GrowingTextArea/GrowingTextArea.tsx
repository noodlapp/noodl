import React, { ChangeEventHandler, FocusEventHandler, KeyboardEventHandler, useEffect, useRef, useState } from 'react';

import css from './GrowingTextArea.module.scss';

interface GrowingTextAreaProps {
  placeholder?: string;
  value: string;

  forwardedTextAreaRef?: any;

  isFocused?: boolean;
  isAutoFocus?: boolean;

  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  onFocus?: FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  onEnter?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
}

export default function GrowingTextArea({
  placeholder = '',
  value,
  forwardedTextAreaRef,

  isFocused,
  isAutoFocus,
  onChange,
  onFocus,
  onBlur,
  onEnter,
  onKeyDown
}: GrowingTextAreaProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef) {
      // reset to check scroll height
      textAreaRef.current.style.height = '0px';
      const scrollHeight = textAreaRef.current.scrollHeight;

      // set the height
      textAreaRef.current.style.height = scrollHeight + 'px';
    }
  }, [textAreaRef, value]);

  useEffect(() => {
    if (!textAreaRef.current || !forwardedTextAreaRef) return;

    forwardedTextAreaRef.current = textAreaRef.current;
  }, [forwardedTextAreaRef, textAreaRef]);

  return (
    <textarea
      className={css.Root}
      onChange={onChange}
      placeholder={placeholder}
      ref={textAreaRef}
      rows={1}
      value={value}
      autoFocus={isAutoFocus}
      onFocus={(e) => {
        e.currentTarget.setSelectionRange(value.length, value.length);
        onFocus && onFocus(e);
      }}
      onKeyDown={(e) => {
        onKeyDown && onKeyDown(e);

        if (e.key === 'Enter') {
          onEnter && onEnter();
          e.stopPropagation();
        }
      }}
      onBlur={(e) => {
        onBlur && onBlur(e);
      }}
    />
  );
}
