import { useEffect, useState } from 'react';

import { CloudService, Environment } from '@noodl-models/CloudServices';
import { ProjectModel } from '@noodl-models/projectmodel';

export function useActiveEnvironment(project: ProjectModel) {
  const [environment, setEnvironment] = useState<Environment>(null);
  const [group] = useState({});

  useEffect(() => {
    function update() {
      CloudService.instance.getActiveEnvironment(project).then((env) => setEnvironment(env));
    }

    update();

    project.on('cloudServicesChanged', update, group);
    return function () {
      project.off(group);
    };
  }, []);

  return environment;
}
