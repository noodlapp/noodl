import { createContext } from 'react';

export interface IModule {
  id: string;
  title: string;
}

export interface IModuleLibraryContext {
  modules: IModule[];
}

const ModuleLibraryContext = createContext<IModuleLibraryContext>({
  modules: null
});
