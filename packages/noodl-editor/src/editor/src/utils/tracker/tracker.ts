export interface TrackerInfo {
  id: string;
  name: string;
  email: string;
}

export interface ITracker {
  setUserInfo(info: TrackerInfo): void;

  track(name: string, args?: any): void;
  increment(name: string, count: number): void;
  error(name: string, args?: any): void;
}

/**
 * I do nothin' da da da da da
 */
export class DummyTracker implements ITracker {
  setUserInfo(info: TrackerInfo): void {}
  track(name: string, args?: any): void {}
  increment(name: string, count: number): void {}
  error(name: string, args?: any): void {}
}
