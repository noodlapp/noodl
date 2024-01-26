import { useMemo } from 'react';

export enum CustomPropertyAnimation {
  EasingBase = '--easing-base',
  EasingEqual = '--easing-equal',
  SpeedQuick = '--speed-quick',
  SpeedBase = '--speed-base',
  SpeedSlow = '--speed-slow'
}

export function useCustomPropertyValue(propertyName: CustomPropertyAnimation): any {
  const styles = useMemo(() => getComputedStyle(document.documentElement), []);

  const style = useMemo(() => {
    const temp = styles.getPropertyValue(propertyName);

    switch (propertyName) {
      case CustomPropertyAnimation.SpeedQuick:
      case CustomPropertyAnimation.SpeedBase:
      case CustomPropertyAnimation.SpeedSlow:
        return parseInt(temp);

      default:
        return temp;
    }
  }, [styles]);

  return style;
}
