import { ActivityQueue, useActivityQueue } from '@noodl-hooks/useActivityQueue';
import { useModernModel } from '@noodl-hooks/useModel';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { CloudService, Environment } from '@noodl-models/CloudServices';
import { CloudServiceMetadata, ProjectModel } from '@noodl-models/projectmodel';
import { getCloudServices, setCloudServices } from '@noodl-models/projectmodel.editor';

import { NO_ENVIRONMENT_VALUE } from '../../DeployPopup/DeployPopup.constants';

interface ICloudServiceContext {
  hasUpdatedEditorEnvironment: boolean;
  editorEnvironmentId: string;
  editorEnvironment: Environment;

  /** Update the current environment in the project metadata */
  setSelectedEnvironment(id: string): void;

  hasActivity: ActivityQueue['hasActivity'];
  runActivity: ActivityQueue['runActivity'];
}

const CloudServiceContext = createContext<ICloudServiceContext>({
  hasUpdatedEditorEnvironment: null,
  editorEnvironmentId: null,
  editorEnvironment: null,
  setSelectedEnvironment: null,
  hasActivity: null,
  runActivity: null
});

export function CloudServiceContextProvider({ children }) {
  const cloudService = useModernModel(CloudService.instance);

  const { hasActivity, runActivity } = useActivityQueue({
    onSuccess: async () => {
      // Always fetch all the backends after something have changed
      await cloudService.backend.fetch();
    }
  });

  const [hasUpdatedEditorEnvironment, setHasUpdatedEditorEnvironment] = useState(false);

  // Listen for selected environment change.
  // TODO: This hook should be somewhere else (project context)
  const [editorEnvironmentId, setEditorEnvironmentId] = useState(NO_ENVIRONMENT_VALUE);
  const [editorEnvironment, setEditorEnvironment] = useState<Environment>(null);

  useEffect(() => {
    function updateSelectedEnvironment() {
      const activeEnvironment = getCloudServices(ProjectModel.instance);

      const environment = cloudService.backend.items.find(
        (x) =>
          x.id === activeEnvironment.id ||
          // Can't find the environment, it's likely an external service.
          // Check if we have a service with the same endpoint and appId
          (x.url === activeEnvironment.endpoint && x.appId === activeEnvironment.appId)
      );

      setEditorEnvironmentId(environment ? environment.id : null);
      setEditorEnvironment(environment || null);
    }

    ProjectModel.instance.on('cloudServicesChanged', updateSelectedEnvironment, this);
    updateSelectedEnvironment();

    return function () {
      ProjectModel.instance?.off(this);
    };
  }, [cloudService.backend.items]);

  function setSelectedEnvironment(id: string) {
    setHasUpdatedEditorEnvironment(true);

    // reset flag after alert has been shown
    setTimeout(() => setHasUpdatedEditorEnvironment(false), 3000);

    const environment = cloudService.backend.items.find((x) => x.id === id);
    const broker: CloudServiceMetadata = environment
      ? {
          id: environment.id,
          endpoint: environment.url,
          appId: environment.appId
        }
      : {
          id: undefined,
          endpoint: undefined,
          appId: undefined
        };

    setCloudServices(ProjectModel.instance, broker);
  }

  return (
    <CloudServiceContext.Provider
      value={{
        hasUpdatedEditorEnvironment,
        editorEnvironmentId,
        editorEnvironment,
        setSelectedEnvironment,
        hasActivity,
        runActivity
      }}
    >
      {children}
    </CloudServiceContext.Provider>
  );
}

export function useCloudServiceContext() {
  const context = useContext(CloudServiceContext);

  if (context === undefined) {
    throw new Error('useCloudServiceContext must be a child of CloudServiceContextProvider');
  }

  return context;
}
