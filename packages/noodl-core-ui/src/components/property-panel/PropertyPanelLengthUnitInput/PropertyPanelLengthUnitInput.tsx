import classNames from 'classnames';
import React, { useState, useEffect } from 'react';

import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import {
  PropertyPanelBaseInput,
  PropertyPanelBaseInputProps
} from '@noodl-core-ui/components/property-panel/PropertyPanelBaseInput';
import { PropertyPanelSelectInput } from '@noodl-core-ui/components/property-panel/PropertyPanelSelectInput';
import { stripCssUnit } from '@noodl-core-ui/utils/stripCssUnit';

import { extractLetters } from '../../../utils/extractLetters';
import { extractNumber } from '../../../utils/extractNumber';
import { normalizeAlphanumericString } from '../../../utils/normalizeAlphanumericString';
import css from './PropertyPanelLengthUnitInput.module.scss';

export interface PropertyPanelLengthUnitInputProps extends Omit<PropertyPanelBaseInputProps, 'type'> {
  properties?: TSFixme;
  hasSmallText?: boolean;
}

export function PropertyPanelLengthUnitInput({
  value,

  isChanged,
  isConnected,

  hasSmallText,

  onChange,
  onError
}: PropertyPanelLengthUnitInputProps) {
  const [isFauxFocused, setIsFauxFocused] = useState(false);

  const cleanedValue = normalizeAlphanumericString(value);
  const numberValue = extractNumber(cleanedValue) || '';
  const unitValue = extractLetters(cleanedValue).replace(' ', '');

  const [displayedInputValue, setDisplayedInputValue] = useState(numberValue);

  useEffect(() => {
    handleInputUpdate(value);
  }, [value]);

  // FIXME: this is very temporary and should be fetched from the panel config
  const unitSelectProps = {
    options: [
      { label: 'px', value: 'px' },
      { label: 'em', value: 'em' },
      { label: 'vh', value: 'vh' },
      { label: '%', value: '%' }
    ]
  };

  function getUnit() {
    const unitOption = unitSelectProps.options.find((option) => option.value === unitValue);

    if (unitOption) return unitOption.value;

    return 'px'; // px as default for some reason
  }

  function handleInputUpdate(inputValue) {
    // TODO: increase/decrease with arrows
    // TODO: handle drag up/down to increase/decrease
    // TODO: handle Arithmetic Error nicer!

    if (inputValue === '') {
      onChange && onChange(inputValue + unitValue);
      return;
    }

    let strippedValue = stripCssUnit(inputValue.toString());
    const unit = inputValue.toString().slice(strippedValue.length); // lol

    const newUnitValue = Boolean(unit) ? unitSelectProps.options.find((option) => option.label === unit)?.value : null;

    if (isArithmeticExpression(strippedValue)) {
      try {
        strippedValue = eval(strippedValue);
      } catch (err) {
        console.log(err);
        onError && onError(err);
      }
    }

    const newNumber = roundCssLengthNumber(parseFloat(strippedValue));

    if (newNumber === 'Error') {
      const error = new Error('Arithmetic Error: Infinite or unsafe number.');
      onError && onError(error);
      console.log(error);
      setDisplayedInputValue(displayedInputValue);
    } else if (!isNaN(newNumber)) {
      const finalNumber = newNumber === 'Error' ? strippedValue : newNumber;
      const finalUnit = newUnitValue || unitValue;

      onChange && onChange(finalNumber + finalUnit);
      setDisplayedInputValue(finalNumber);
    }
  }

  function handleUnitUpdate(unit: string) {
    onChange && onChange(numberValue + unit);
  }

  return (
    <div className={classNames(css['Root'], isFauxFocused && css['is-faux-focused'])}>
      <PropertyPanelBaseInput
        value={displayedInputValue}
        type="text"
        isChanged={isChanged}
        isConnected={isConnected}
        onChange={(value) => setDisplayedInputValue(value)}
        isFauxFocused={isFauxFocused}
        onFocus={() => setIsFauxFocused(() => true)}
        onKeyDown={(e) => e.key === 'Enter' && handleInputUpdate(displayedInputValue)}
        onBlur={() => {
          setIsFauxFocused(() => false);
          handleInputUpdate(displayedInputValue);
        }}
        hasSmallText={hasSmallText}
      />

      <div className={classNames(css['UnitContainer'], hasSmallText && css['has-small-text'])}>
        <PropertyPanelSelectInput
          value={getUnit()}
          properties={unitSelectProps}
          onChange={handleUnitUpdate}
          isFauxFocused={isFauxFocused}
          onFocus={() => setIsFauxFocused(() => true)}
          onBlur={() => setIsFauxFocused(() => false)}
          hasHiddenCaret
          hasSmallText={hasSmallText}
        />
      </div>
    </div>
  );
}

function isArithmeticExpression(str) {
  const arithmeticRegex = /^[-+*/()\d\s.]+$/;
  return arithmeticRegex.test(str);
}

function roundCssLengthNumber(num) {
  if (isNaN(num)) {
    console.warn('Passed in NaN to PropertyPanelLengthInput. Changing it to empty string');
    return '';
  }
  if (!isFinite(num) || num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    return 'Error';
  } else if (Number.isInteger(num)) {
    return num.toFixed(0); // Display the number without decimals
  } else {
    const roundedNum = num.toFixed(2); // Round the number to two decimal places
    const decimalPart = roundedNum.split('.')[1];
    if (decimalPart === '00') {
      return roundedNum.split('.')[0] + '.0'; // Show only one decimal if the second decimal is "0"
    } else if (decimalPart?.endsWith('0')) {
      return roundedNum.split('.')[0] + '.' + decimalPart[0]; // Show only one decimal if the second decimal is "0"
    } else {
      return roundedNum;
    }
  }
}
