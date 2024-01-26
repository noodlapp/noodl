import { NodeType } from '@noodl-constants/NodeType';

// TODO: Remove this, use the types in the editor instead.
// TODO: This is BasicNodeType
export interface INodeType {
  allowAsChild: boolean;
  allowAsExportRoot: boolean;
  category: string;
  color: NodeType;
  displayNodeName: string;
  docs: string;
  dynamicports: TSFixme[];
  listeners: TSFixme[];
  name: string;
  ports: TSFixme[];
  shortDocs: string;
  useVariants: boolean;
  visualStates: TSFixme[];
  displayName: string;
  fullName: string;
  localName: string;
  model: TSFixme;
  type: string;
  searchTags: string[];
}

export interface INodeColorScheme {
  base: string;
  baseHighlighted: string;
  header: string;
  headerHighlighted: string;
  outline: string;
  outlineHighlighted: string;
  text: string;
}
