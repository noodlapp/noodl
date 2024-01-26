export enum RuntimeType {
  Browser = 'browser',
  Cloud = 'cloud'
}

export const RuntimeTypes: RuntimeType[] = [RuntimeType.Browser, RuntimeType.Cloud];

export interface NodeLibraryDataNode {
  name: string;
  description: string;
  type: string;
  subCategories: {
    name: string;
    items: string[];
  }[];
}

export interface NodeLibraryTypecast {
  from: string;
  to: string[];
}

export interface NodeLibraryDataDynamicPort {
  type: string;
  name: string;
}

export interface NodeLibraryDataNodeColors {
  base: string;
  baseHighlighted: string;
  header: string;
  headerHighlighted: string;
  outline: string;
  outlineHighlighted: string;
  text: string;
}

export interface NodeLibraryDataConnectionColors {
  normal: string;
  highlighted: string;
  pulsing: string;
}

export interface NodeLibraryDataNodeType {
  runtimeTypes?: RuntimeType[];
  name: string;
  shortDesc: string;
  docs: string;
  color: string;
  allowAsChild: boolean;
  category: string;
  haveComponentChildren: string[];
}

export interface NodeLibraryData {
  projectsettings: TSFixme;

  typecasts: NodeLibraryTypecast[];

  dynamicports: NodeLibraryDataDynamicPort[];

  colors: {
    nodes: {
      component: NodeLibraryDataNodeColors;
      visual: NodeLibraryDataNodeColors;
      data: NodeLibraryDataNodeColors;
      javascript: NodeLibraryDataNodeColors;
      default: NodeLibraryDataNodeColors;
    };
    connections: {
      signal: NodeLibraryDataConnectionColors;
      default: NodeLibraryDataConnectionColors;
    };
  };

  nodetypes: NodeLibraryDataNodeType[];

  nodeIndex: {
    coreNodes: NodeLibraryDataNode[];
    moduleNodes: {
      name: string;
      items: TSFixme[];
    }[];
  };
}
