export type NeueSession = {
  token: string;
  tokenUpdatedAt: number;
};

export type NeueDevice = {
  id: string;
  name: string;
  description: string;
  environmentId: string;
  config: string;
  flow: string;
};

export type NeueFlow = {
  id: string;
  data: string;
};

export type NeueEnvironment = {
  devices: NeueDevice[];
  flows: string[];
};
