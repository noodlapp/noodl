export function extractNumber(string: string) {
  return parseFloat(string.replace(/[^\d.-]/g, ''));
}
