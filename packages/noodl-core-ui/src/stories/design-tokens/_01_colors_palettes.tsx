import React from 'react';
import { base_color_names, theme_color_names } from '@noodl-core-ui/styles/colors';
import { ColorPalette, ColorItem } from '@storybook/addon-docs/blocks';

// https://css-tricks.com/how-to-get-all-custom-properties-on-a-page-in-javascript/
function allCSSVariables() {
  const isSameDomain = (styleSheet) => {
    // Internal style blocks won't have an href value
    if (!styleSheet.href) {
      return true;
    }
    return styleSheet.href.indexOf(window.location.origin) === 0;
  };
  const isStyleRule = (rule) => rule.type === 1;
  return [...document.styleSheets].filter(isSameDomain).reduce(
    (finalArr, sheet) =>
      finalArr.concat(
        // cssRules is array-like, so we convert it to an array
        [...sheet.cssRules].filter(isStyleRule).reduce((propValArr, rule) => {
          // @ts-expect-error
          const props = [...rule.style]
            // @ts-expect-error
            .map((propName) => [propName.trim(), rule.style.getPropertyValue(propName).trim()])
            // Discard any props that don't start with "--". Custom props are required to.
            .filter(([propName]) => propName.indexOf('--') === 0);

          return [...propValArr, ...props];
        }, [])
      ),
    []
  );
}

export function getColorsFromCSSVar(keys: { [key: string]: string }) {
  return allCSSVariables().reduce((result, [key, value]) => {
    const base_color = Object.keys(keys).find((x) => key.startsWith(x));
    if (base_color) {
      if (!result[base_color]) {
        result[base_color] = {
          name: keys[base_color],
          items: []
        };
      }
      result[base_color].items.push({
        key: key,
        prefix: key.substring(base_color.length + 1),
        value
      });
    }
    return result;
  }, {});
}

export function BaseColorPaletteSheet() {
  const colors = getColorsFromCSSVar(base_color_names);

  return (
    <ColorPalette>
      {Object.keys(colors).map((key) => (
        <ColorItem
          key={key}
          title={colors[key].name}
          subtitle={key + '-<code>'}
          colors={colors[key].items.reduce((result, x) => {
            result[x.prefix] = x.value;
            return result;
          }, {})}
        />
      ))}
    </ColorPalette>
  );
}

export function ThemeColorPaletteSheet() {
  const colors = getColorsFromCSSVar(theme_color_names);

  return (
    <ColorPalette>
      {Object.keys(colors).map((key) => (
        <ColorItem
          key={key}
          title={colors[key].name}
          subtitle={key + '-<code>'}
          colors={colors[key].items.reduce((result, x) => {
            result[x.prefix] = x.value;
            return result;
          }, {})}
        />
      ))}
    </ColorPalette>
  );
}
