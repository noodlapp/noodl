import { Icon, IconName } from '@noodl-core-ui/components/common/Icon';
import { UnsafeStyleProps } from '@noodl-core-ui/types/global';
import classNames from 'classnames';
import React, { Ref } from 'react';
import css from './SearchInput.module.scss';

export interface SearchInputProps extends UnsafeStyleProps {
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  value?: string;

  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: () => void;

  isAutoFocus?: boolean;
}

export function SearchInput({
  placeholder,
  value,
  inputRef,
  onChange,
  onFocus,
  onBlur,
  onClick,
  UNSAFE_className,
  UNSAFE_style,
  isAutoFocus
}: SearchInputProps) {
  return (
    <div className={css['Root']}>
      <input
        className={classNames(css['SearchInput'], UNSAFE_className)}
        type="text"
        placeholder={placeholder}
        ref={inputRef}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onClick}
        style={UNSAFE_style}
        value={value}
        autoFocus={isAutoFocus}
      />
      <Icon icon={IconName.Search} UNSAFE_className={css['SearchInputIcon']} />
    </div>
  );
}
