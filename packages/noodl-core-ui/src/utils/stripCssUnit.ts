export function stripCssUnit(string) {
  const cssUnitRegex = /^-?\d*\.?\d+(px|em|rem|vh|vw|%|ex|ch|cm|mm|in|pt|pc)$/i;
  if (cssUnitRegex.test(string)) {
    return string.slice(0, string.match(cssUnitRegex)[1].length * -1); // Remove the last characters representing the CSS unit
  }
  return string;
}
