export default class Model {
  events: { [key: string]: string };

  listeners: TSFixme[];
  static _listenersEnabled: boolean;

  set(args: TSFixme): void;

  on(event: string | string[], listener: (...args: any) => void, group?: number | string | object): Model;
  once(event: string | string[], listener: (...args: any) => void): Model;

  notifyListeners(event: string, ...args: any[]): Model;
  off(group: number | string | object): Model;
  removeAllListeners(): void;
}
