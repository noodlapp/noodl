import { ComponentModel } from '@noodl-models/componentmodel';

import { IconName } from '@noodl-core-ui/components/common/Icon';

export enum ComponentIconType {
  Page = IconName.File,
  CloudFunction = IconName.CloudFunction,
  Visual = 2
}

const typenames: { [key: string]: ComponentIconType } = {
  Page: ComponentIconType.Page,
  'noodl.cloud.request': ComponentIconType.CloudFunction
};

export function getComponentIconType(component: ComponentModel): ComponentIconType {
  let icon: ComponentIconType = undefined;

  if (component?.graph?.getVisualRootIds().length) {
    icon = ComponentIconType.Visual;
  }

  component?.graph.forEachNode((component) => {
    if (typenames[component.typename]) {
      icon = typenames[component.typename];
    }
  });

  return icon;
}
