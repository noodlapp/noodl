import { Environment } from '@noodl-models/CloudServices';
import { ProjectModel } from '@noodl-models/projectmodel';
import { IModel } from '@noodl-utils/model';

export type CreateEnvironmentRequest = {
  name: string | undefined;
  description?: string | undefined;
  appId: string;
  url: string;
  masterKey: string;
};

export type UpdateEnvironmentRequest = {
  id: string;
  name: string | undefined;
  description: string | undefined;
  appId: string | undefined;
  masterKey: string | undefined;
  url: string | undefined;
};

export type CreateEnvironment = {
  id: string;
  masterKey: string;
  appId: string;
  url: string;
};

export interface ICloudBackendService {
  get isLoading(): boolean;
  get items(): Environment[];

  fetch(): Promise<Environment[]>;
  fromProject(project: ProjectModel): Promise<Environment> | undefined;
  create(options: CreateEnvironmentRequest): Promise<CreateEnvironment>;
  update(options: UpdateEnvironmentRequest): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export enum CloudServiceEvent {
  ConfigUpdated,
  BackendUpdated
}

export type CloudServiceEvents = {
  [CloudServiceEvent.ConfigUpdated]: () => void;
  [CloudServiceEvent.BackendUpdated]: () => void;
};

export interface ICloudService extends IModel<CloudServiceEvent, CloudServiceEvents> {
  /** Reset the current session token. */
  reset(): void;

  getActiveEnvironment(project: ProjectModel): Promise<Environment>;

  get backend(): ICloudBackendService;
}
