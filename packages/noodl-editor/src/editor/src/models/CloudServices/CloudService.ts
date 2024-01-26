import { Environment, ExternalCloudService } from '@noodl-models/CloudServices/ExternalCloudService';
import {
  CloudServiceEvent,
  CloudServiceEvents,
  CreateEnvironment,
  CreateEnvironmentRequest,
  ICloudBackendService,
  ICloudService,
  UpdateEnvironmentRequest
} from '@noodl-models/CloudServices/type';
import { ProjectModel } from '@noodl-models/projectmodel';
import { getCloudServices } from '@noodl-models/projectmodel.editor';
import { Model } from '@noodl-utils/model';

export type CloudQueueItem = {
  frontendId: string;
  environmentId: string;
};

class CloudBackendService implements ICloudBackendService {
  private _isLoading = false;
  private _collection?: Environment[];
  private _localExternal = new ExternalCloudService();

  get isLoading(): boolean {
    return this._isLoading;
  }

  get items(): Environment[] {
    return this._collection || [];
  }

  constructor(private readonly service: CloudService) {}

  async fetch(): Promise<Environment[]> {
    this._isLoading = true;
    try {
      // Fetch environments from local machine
      const localEnvironments = await this._localExternal.list();
      this._collection = localEnvironments.map((x) => new Environment(x));
    } finally {
      this._isLoading = false;
      this.service.notifyListeners(CloudServiceEvent.BackendUpdated);
    }
    return this._collection;
  }

  async fromProject(project: ProjectModel): Promise<Environment> {
    const activeCloudServices = getCloudServices(project);
    if (!this._collection) {
      await this.fetch();
    }

    return this.items.find((b) => {
      return b.url === activeCloudServices.endpoint && b.appId === activeCloudServices.appId;
    });
  }

  async create(options: CreateEnvironmentRequest): Promise<CreateEnvironment> {
    return await this._localExternal.create(options);
  }

  async update(options: UpdateEnvironmentRequest): Promise<boolean> {
    return await this._localExternal.update(options);
  }

  async delete(id: string): Promise<boolean> {
    return await this._localExternal.delete(id);
  }
}

export class CloudService extends Model<CloudServiceEvent, CloudServiceEvents> implements ICloudService {
  public static instance: CloudService = new CloudService();

  private _backend: ICloudBackendService;

  public get backend(): ICloudBackendService {
    return this._backend;
  }

  public updateQueue: CloudQueueItem[];

  constructor() {
    super();
    this._backend = new CloudBackendService(this);
  }

  public reset() {
    this._backend = new CloudBackendService(this);
    this.notifyListeners(CloudServiceEvent.BackendUpdated);
  }

  /**
   * this should only be called when going between projects
   */
  public async prefetch() {
    this.reset();
    await this.fetch();
  }

  public async fetch() {
    await this.backend.fetch();
  }

  public async getActiveEnvironment(project: ProjectModel): Promise<Environment> {
    await this.backend.fetch();
    return this.backend.fromProject(project);
  }
}
