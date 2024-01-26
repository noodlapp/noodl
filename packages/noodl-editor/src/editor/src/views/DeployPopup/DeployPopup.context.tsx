import { ActivityQueue, useActivityQueue } from '@noodl-hooks/useActivityQueue';
import React, { createContext, useContext } from 'react';

export type DeployUpdateQueueItem = {
  frontendId: string;
  environmentId: string;
};

// Based on:
// https://github.com/noodlapp/noodl/tree/ac0c3fc39ff11282fd91fb90a58423c4d02bdc3a/packages/noodl-editor/src/editor/src/contexts/HostingContext
interface IDeployContext {
  updateQueue: DeployUpdateQueueItem[];

  hasActivity: ActivityQueue['hasActivity'];
  runActivity: ActivityQueue['runActivity'];
}

const DeployContext = createContext<IDeployContext>({
  updateQueue: null,
  hasActivity: null,
  runActivity: null
});

export function DeployContextProvider({ children }: TSFixme) {
  const { hasActivity, runActivity } = useActivityQueue({});

  return (
    <DeployContext.Provider
      value={{
        updateQueue: null,
        hasActivity,
        runActivity
      }}
    >
      {children}
    </DeployContext.Provider>
  );
}

export function useDeployContext() {
  const context = useContext(DeployContext);

  if (context === undefined) {
    throw new Error('useDeployContext must be a child of DeployContextProvider');
  }

  return context;
}
