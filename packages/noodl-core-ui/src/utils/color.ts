import { BADGE_COLORS } from '@noodl-core-ui/styles/badges';

export function getColorFromMap(baseString: string, colorMap: typeof BADGE_COLORS) {
  function hashCode(str) {
    var hash = 0,
      i,
      chr;
    if (!str?.length) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  return colorMap[Math.abs(hashCode(baseString)) % colorMap.length];
}
