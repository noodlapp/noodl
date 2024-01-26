export function linearMap(
  currentValue: number,
  currentMin: number,
  currentMax: number,
  newMin: number,
  newMax: number
) {
  const newSize = newMax - newMin;
  const oldSize = currentMax - currentMin;
  const oldScale = currentValue - currentMin;
  return (newSize * oldScale) / oldSize + newMin;
}
