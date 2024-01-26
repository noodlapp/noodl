import classNames from 'classnames';
import React from 'react';

import { PropertyPanelLengthUnitInput } from '@noodl-core-ui/components/property-panel/PropertyPanelLengthUnitInput';

import css from './PropertyPanelMarginPadding.module.scss';

export interface PropertyPanelMarginPaddingValues {
  padding?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

export interface PropertyPanelMarginPaddingProps {
  values?: PropertyPanelMarginPaddingValues;

  hasHiddenPadding?: boolean;
  hasHiddenMargin?: boolean;

  onChange?: (PropertyPanelMarginPaddingValues) => void;
}

export function PropertyPanelMarginPadding({
  values,

  hasHiddenMargin,
  hasHiddenPadding,

  onChange
}: PropertyPanelMarginPaddingProps) {
  function handleChange(value, type, direction) {
    const newValues = { ...values };

    newValues[type][direction] = value;

    onChange && onChange(newValues);
  }

  return (
    <div className={css['Root']}>
      <div className={css['TopContainer']}>
        <div className={classNames(css['InputContainer'], hasHiddenMargin && css['is-hidden'])}>
          <PropertyPanelLengthUnitInput
            value={values.margin.top}
            onChange={(value) => handleChange(value, 'margin', 'top')}
            hasSmallText={true}
          />
        </div>
      </div>

      <div className={css['CenterContainer']}>
        <div className={classNames(css['InputContainer'], hasHiddenMargin && css['is-hidden'])}>
          <PropertyPanelLengthUnitInput
            value={values.margin.left}
            onChange={(value) => handleChange(value, 'margin', 'left')}
            hasSmallText={true}
          />
        </div>

        <div className={css['PaddingContainer']}>
          <div className={css['TopContainer']}>
            <div className={classNames(css['InputContainer'], hasHiddenPadding && css['is-hidden'])}>
              <PropertyPanelLengthUnitInput
                value={values.padding.top}
                onChange={(value) => handleChange(value, 'padding', 'top')}
                hasSmallText={true}
              />
            </div>
          </div>

          <div className={css['CenterContainer']}>
            <div className={classNames(css['InputContainer'], hasHiddenPadding && css['is-hidden'])}>
              <PropertyPanelLengthUnitInput
                value={values.padding.left}
                onChange={(value) => handleChange(value, 'padding', 'left')}
                hasSmallText={true}
              />
            </div>
            <div className={classNames(css['InputContainer'], hasHiddenPadding && css['is-hidden'])}>
              <PropertyPanelLengthUnitInput
                value={values.padding.right}
                onChange={(value) => handleChange(value, 'padding', 'right')}
                hasSmallText={true}
              />
            </div>
          </div>

          <div className={css['BottomContainer']}>
            <div className={classNames(css['InputContainer'], hasHiddenPadding && css['is-hidden'])}>
              <PropertyPanelLengthUnitInput
                value={values.padding.bottom}
                onChange={(value) => handleChange(value, 'padding', 'bottom')}
                hasSmallText={true}
              />
            </div>
          </div>
        </div>

        <div className={classNames(css['InputContainer'], hasHiddenMargin && css['is-hidden'])}>
          <PropertyPanelLengthUnitInput
            value={values.margin.right}
            onChange={(value) => handleChange(value, 'margin', 'right')}
            hasSmallText={true}
          />
        </div>
      </div>

      <div className={css['BottomContainer']}>
        <div className={classNames(css['InputContainer'], hasHiddenMargin && css['is-hidden'])}>
          <PropertyPanelLengthUnitInput
            value={values.margin.bottom}
            onChange={(value) => handleChange(value, 'margin', 'bottom')}
            hasSmallText={true}
          />
        </div>
      </div>
    </div>
  );
}
