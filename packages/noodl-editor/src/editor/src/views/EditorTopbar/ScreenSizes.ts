import { IconName } from '@noodl-core-ui/components/common/Icon';

export type ScreenSize = {
  name: string;
  group: 'Mobile' | 'Tablet' | 'Desktop' | 'Desktop small' | 'Editor';
  width: number;
  height: number;
};

export const screenSizesWithDividers: (ScreenSize | 'divider')[] = [
  {
    name: 'Fit viewport',
    group: 'Editor',
    width: null,
    height: null
  },
  'divider',
  {
    name: 'Desktop, common',
    group: 'Desktop',
    width: 1920,
    height: 1080
  },
  {
    name: 'Desktop, medium',
    group: 'Desktop small',
    width: 1366,
    height: 768
  },
  {
    name: 'Desktop, small',
    group: 'Desktop small',
    width: 1024,
    height: 768
  },
  'divider',
  {
    name: 'Tablet, large',
    group: 'Tablet',
    width: 800,
    height: 1280
  },
  {
    name: 'Tablet, common',
    group: 'Tablet',
    width: 768,
    height: 1024
  },
  {
    name: 'Tablet, small',
    group: 'Tablet',
    width: 601,
    height: 962
  },
  'divider',
  {
    name: 'Mobile, big',
    group: 'Mobile',
    width: 414,
    height: 896
  },
  {
    name: 'Mobile, common',
    group: 'Mobile',
    width: 360,
    height: 800
  },
  {
    name: 'Mobile, small',
    group: 'Mobile',
    width: 320,
    height: 568
  }
];

//@ts-expect-error TODO: make proper type when i know it works
export const screenSizes: ScreenSize[] = screenSizesWithDividers.filter((item) => typeof item !== 'string');

export function getIconFromScreenSizeGroupName(group: ScreenSize['group']) {
  switch (group) {
    case 'Desktop':
      return IconName.DeviceDesktop;
    case 'Desktop small':
      return IconName.DeviceLaptop;
    case 'Tablet':
      return IconName.DeviceTablet;
    case 'Mobile':
      return IconName.DevicePhone;
    case 'Editor':
      return IconName.ViewportDiagonalArrow;
    default:
      return IconName.User;
  }
}

export function getScreenSizeObjectFromMeasurements(width: number, height: number) {
  const size = screenSizes.find((screen) => screen.width === width && screen.height === height);
  return size ? size : screenSizes[0];
}
