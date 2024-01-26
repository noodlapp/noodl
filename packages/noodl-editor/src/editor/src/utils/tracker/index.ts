import { DummyTracker, ITracker } from './tracker';

export * from './tracker';

let tracker: ITracker = new DummyTracker();

function setTracker(value: ITracker): void {
  tracker = value;
}

export { tracker, setTracker };
