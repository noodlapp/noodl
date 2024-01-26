import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    'noodl-style-tag'?: string;
  }
}

type TSFixme = any;

type NodeConstructor = any;

type NodeContext = any;

type GraphModel = any;

type NodeRegister = any;

type GlobalNoodl = {
  getProjectSettings: TSFixme;
  getMetaData: TSFixme;
  Collection: TSFixme;
  Model: TSFixme;
  Variables: TSFixme;
  Events: TSFixme;
  Records: TSFixme;
  Users: TSFixme;
  CloudFunctions: TSFixme;
  Navigation: TSFixme;
  Files: TSFixme;
};

interface Window {
  Noodl: GlobalNoodl;
}
