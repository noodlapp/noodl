import { IFileSystem } from './filesystem';
import { IPlatform, PlatformWeb } from './platform';
import { IStorage } from './storage';
import { StorageWeb } from './storage/storage-web';

export * from './filesystem';
export * from './platform';
export * from './storage';
export * from './utils';

let platform: IPlatform = new PlatformWeb('0.0.0', undefined, '0');
let filesystem: IFileSystem;
let JSONStorage: IStorage = new StorageWeb();

export { platform, filesystem, JSONStorage };

export function setPlatform(value: IPlatform): void {
  platform = value;
}

export function setFileSystem(value: IFileSystem): void {
  filesystem = value;
}

export function setStorage(value: IStorage): void {
  JSONStorage = value;
}
