export interface IStorage {
  get(key: string): Promise<any>;
  set(key: string, data: { [key: string]: any }): Promise<void>;
  remove(key: string): Promise<void>;
}
