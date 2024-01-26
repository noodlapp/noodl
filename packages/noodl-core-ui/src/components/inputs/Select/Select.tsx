import classNames from 'classnames';
import React, { useMemo, useRef, useState } from 'react';

import { InputNotification } from '@noodl-types/globalInputTypes';

import { Icon, IconName } from '@noodl-core-ui/components/common/Icon';
import { BaseDialog, BaseDialogVariant, DialogRenderDirection } from '@noodl-core-ui/components/layout/BaseDialog';
import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import { InputLabelSection } from '../InputLabelSection';
import { NotificationFeedbackDisplay } from '../NotificationFeedbackDisplay';
import { useNotificationFeedbackDisplay } from '../NotificationFeedbackDisplay/NotificationFeedbackDisplay.hooks';
import css from './Select.module.scss';

export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  isDisabled?: boolean;
}

export enum SelectColorTheme {
  Transparent = 'is-color-theme-transparent',
  Dark = 'is-color-theme-dark',
  DarkLighter = 'is-color-theme-dark-lighter'
}

export enum SelectSize {
  Default = 'is-size-default',
  Small = 'is-size-small'
}

export interface SelectProps extends UnsafeStyleProps {
  options: SelectOption[];
  value?: SelectOption['value'];
  placeholder?: string;
  notification?: InputNotification;
  label?: string;
  colorTheme?: SelectColorTheme;
  size?: SelectSize;

  hasBottomSpacing?: boolean;
  isOptionsPushingSiblings?: boolean;
  isDisabled?: boolean;

  onChange?: (value: SelectOption['value']) => void;

  testId?: string;
}

export function Select({
  options = [],
  value,
  placeholder = 'Select an option',
  notification,
  label,
  colorTheme = SelectColorTheme.Dark,
  size = SelectSize.Default,

  isOptionsPushingSiblings,
  hasBottomSpacing,
  isDisabled,

  onChange,

  testId,

  UNSAFE_className,
  UNSAFE_style
}: SelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [newNotification, updateNotification] = useNotificationFeedbackDisplay(notification);
  const [showOptions, setShowOptions] = useState(false);

  const selectedOption = useMemo(() => {
    if (value === undefined) return null;

    return options.find((option) => option.value === value);
  }, [options, value]);

  return (
    <>
      {label && <InputLabelSection label={label} />}

      <div
        ref={rootRef}
        tabIndex={1}
        className={classNames([
          css['Root'],
          css[colorTheme],
          hasBottomSpacing && css['has-bottom-spacing'],
          isDisabled && css['is-disabled'],
          showOptions && css['is-focused'],
          UNSAFE_className
        ])}
        //onBlur={() => setShowOptions(false)}
        data-test={testId}
        style={UNSAFE_style}
      >
        <div className={css['DisplayContainer']} onClick={() => setShowOptions(!showOptions)}>
          <div className={classNames([css['DisplayText'], css[size], !selectedOption?.label && css['is-placeholder']])}>
            {selectedOption?.label || placeholder}
          </div>
          <Icon UNSAFE_className={css['Icon']} icon={IconName.CaretDown} />

          {newNotification && <NotificationFeedbackDisplay notification={newNotification} />}
        </div>

        <div
          className={classNames([
            css['OptionsContainer'],
            isOptionsPushingSiblings ? css['is-options-pushing-siblings'] : css['is-options-overlaid']
          ])}
        >
          <BaseDialog
            triggerRef={rootRef}
            variant={BaseDialogVariant.Select}
            isVisible={showOptions}
            onClose={() => setShowOptions(false)}
            renderDirection={DialogRenderDirection.Below}
            isLockingScroll
          >
            <div className={classNames([css['OptionsList'], css[colorTheme]])}>
              {options.map((option) => {
                if (option.value === value) return null;

                return (
                  <div
                    data-test="select-option"
                    key={option.value}
                    className={classNames([
                      css['Option'],
                      css[size],
                      option.isDisabled && css['is-disabled'],
                      option.value === value && css['is-selected']
                    ])}
                    onClick={() => {
                      if (option.isDisabled) return;

                      setShowOptions(false);
                      onChange(option.value);
                    }}
                  >
                    {option.label}
                  </div>
                );
              })}
            </div>
          </BaseDialog>
        </div>
      </div>
    </>
  );
}
