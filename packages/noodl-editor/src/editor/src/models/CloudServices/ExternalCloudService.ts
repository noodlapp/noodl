import { JSONStorage } from '@noodl/platform';

import { CreateEnvironment, CreateEnvironmentRequest, UpdateEnvironmentRequest } from '@noodl-models/CloudServices';

/** The data format is separated from our internal model. */
export type EnvironmentDataFormat = {
  enabled: boolean;
  id: string;
  name: string;
  description: string;
  masterKey: string;
  appId: string;
  endpoint: string;
};

export class ExternalCloudService {
  async list(): Promise<EnvironmentDataFormat[]> {
    const local = await JSONStorage.get('externalBrokers');
    return local.brokers || [];
  }

  async create(options: CreateEnvironmentRequest): Promise<CreateEnvironment> {
    const id = `${options.url}-${options.appId}`;

    const newBroker: EnvironmentDataFormat = {
      enabled: true,
      id,
      name: options.name,
      description: options.description,
      masterKey: options.masterKey,
      appId: options.appId,
      endpoint: options.url
    };

    const local = await JSONStorage.get('externalBrokers');
    const brokers: EnvironmentDataFormat[] = local.brokers || [];
    await JSONStorage.set('externalBrokers', { brokers: [...brokers, newBroker] });

    return {
      id: newBroker.id,
      appId: newBroker.appId,
      url: newBroker.endpoint,
      masterKey: newBroker.masterKey
    };
  }

  async update(options: UpdateEnvironmentRequest): Promise<boolean> {
    const local = await JSONStorage.get('externalBrokers');
    const brokers: EnvironmentDataFormat[] = local.brokers || [];

    // Find and update
    const broker = brokers.find((x) => x.id === options.id);
    if (!broker) return false;

    if (typeof options.name !== undefined) broker.name = options.name;
    if (typeof options.description !== undefined) broker.description = options.description;
    if (typeof options.appId !== undefined) broker.appId = options.appId;
    if (typeof options.masterKey !== undefined) broker.masterKey = options.masterKey;
    if (typeof options.url !== undefined) broker.endpoint = options.url;

    await JSONStorage.set('externalBrokers', { brokers });

    return true;
  }

  async delete(id: string): Promise<boolean> {
    const local = await JSONStorage.get('externalBrokers');
    const brokers: EnvironmentDataFormat[] = local.brokers || [];

    // Find the environment
    const found = brokers.find((b) => b.id === id);
    if (found) {
      // Delete the environment
      brokers.splice(brokers.indexOf(found), 1);
    }

    // Save the list
    await JSONStorage.set('externalBrokers', { brokers });
    return true;
  }
}

export class Environment {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  masterKeyUpdatedAt: string;
  masterKey: string;
  appId: string;
  url: string;

  constructor(item: EnvironmentDataFormat) {
    this.id = item.id;
    this.name = item.name;
    this.description = item.description;
    this.createdAt = '';
    this.masterKeyUpdatedAt = '';
    this.masterKey = item.masterKey;
    this.appId = item.appId;
    this.url = item.endpoint;
  }
}
