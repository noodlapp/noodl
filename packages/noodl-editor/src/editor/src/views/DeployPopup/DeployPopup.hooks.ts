import { ICloudService } from '@noodl-models/CloudServices';

import { NO_ENVIRONMENT_VALUE } from './DeployPopup.constants';

/**
 * No caching, enjoy!
 *
 * @param cloudService
 * @returns
 */
export function useEnvironmentsAsOptions(cloudService: ICloudService) {
  const options = [{ label: 'No cloud service', value: NO_ENVIRONMENT_VALUE }];

  if (!cloudService.backend.items?.length) return options;

  cloudService.backend.items.forEach((env) => {
    options.push({ label: env.name, value: env.id });
  });

  return options;
}
