import React, { createContext, useContext, useEffect } from 'react';

import { Slot } from '@noodl-core-ui/types/global';

import { commandEventHandler } from './iframe';

export interface PluginContext {}

const PluginContext = createContext<PluginContext>({});

export interface PluginContextProps {
  children: Slot;
}

export function PluginContextProvider({ children }: PluginContextProps) {
  // Listen for all the iframe commands
  useEffect(() => {
    window.addEventListener('message', commandEventHandler, false);
    return function () {
      window.removeEventListener('message', commandEventHandler, false);
    };
  }, []);

  return <PluginContext.Provider value={{}}>{children}</PluginContext.Provider>;
}

export function usePluginContext() {
  const context = useContext(PluginContext);

  if (context === undefined) {
    throw new Error('usePluginContext must be a child of PluginContextProvider');
  }

  return context;
}
