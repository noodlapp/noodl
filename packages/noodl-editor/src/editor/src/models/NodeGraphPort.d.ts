export type NodeGrapPort = {
  name: string;
  displayName?: string;
  plug: 'input' | 'output' | 'input/output';
  type: any;
  group?: string;
  index?: number;
  default?: any;
};
