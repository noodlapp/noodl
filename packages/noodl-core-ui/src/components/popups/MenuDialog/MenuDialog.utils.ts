export function insertDividerBetweenAllItems(array) {
  return [].concat(...array.map((item) => [item, 'divider'])).slice(0, -1);
}
