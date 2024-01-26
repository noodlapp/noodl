import { IStorage } from "./common";

export class StorageWeb implements IStorage {
  get(key: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  set(key: string, data: { [key: string]: any }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  remove(key: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
