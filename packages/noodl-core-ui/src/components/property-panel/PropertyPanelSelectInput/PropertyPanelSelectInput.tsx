import classNames from 'classnames';
import React, { useRef, useState } from 'react';

import { BaseDialog, DialogBackground, BaseDialogVariant } from '@noodl-core-ui/components/layout/BaseDialog';
import {
  PropertyPanelBaseInput,
  PropertyPanelBaseInputProps
} from '@noodl-core-ui/components/property-panel/PropertyPanelBaseInput';

import { ReactComponent as CaretIcon } from '../../../assets/icons/caret-down.svg';
import css from './PropertyPanelSelectInput.module.scss';

export interface PropertyPanelSelectProperties {
  options: {
    label: string;
    value: string | number;
    isDisabled?: boolean;
  }[];
}

export interface PropertyPanelSelectInputProps extends Omit<PropertyPanelBaseInputProps, 'type' | 'onClick'> {
  onChange?: (value: string | number) => void;
  properties: PropertyPanelSelectProperties;
  hasSmallText?: boolean;
}

export function PropertyPanelSelectInput({
  value,
  properties,

  isFauxFocused,

  onChange,
  onFocus,
  onBlur,

  hasHiddenCaret,

  hasSmallText
}: PropertyPanelSelectInputProps) {
  const [isSelectCollapsed, setIsSelectCollapsed] = useState(true);
  const rootRef = useRef<HTMLDivElement>();

  const displayValue = properties?.options.find((option) => option.value === value)?.label;

  return (
    <div className={classNames(css['Root'], !hasHiddenCaret && css['has-caret'])} ref={rootRef}>
      <PropertyPanelBaseInput
        type="text"
        value={displayValue}
        hasHiddenCaret
        onClick={() => {
          setIsSelectCollapsed((prev) => !prev);
        }}
        onBlur={(e) => {
          setTimeout(() => {
            setIsSelectCollapsed(true);
          }, 250);
          if (onBlur) onBlur(e);
        }}
        onFocus={onFocus}
        isFauxFocused={isFauxFocused}
        hasSmallText={hasSmallText}
      />

      {!hasHiddenCaret && (
        <div
          className={classNames(css['Caret'], !isSelectCollapsed && css['is-indicating-close'])}
          onClick={() => {
            setIsSelectCollapsed((prev) => !prev);
          }}
        >
          <CaretIcon />
        </div>
      )}

      <BaseDialog
        isVisible={!isSelectCollapsed}
        triggerRef={rootRef}
        background={DialogBackground.Transparent}
        variant={BaseDialogVariant.Select}
      >
        <ul className={css['Options']}>
          {properties?.options?.map((option) => {
            if (option.value === value) return null;

            return (
              <li
                key={option.value}
                className={classNames(
                  css['Option'],
                  option.isDisabled && css['is-disabled'],
                  hasSmallText && css['has-small-text']
                )}
                onClick={() => {
                  setIsSelectCollapsed(true);

                  if (option.isDisabled) return null;

                  onChange && onChange(option.value);
                }}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      </BaseDialog>
    </div>
  );
}
