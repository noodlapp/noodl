import { ArrayDiff } from '@noodl-utils/projectmerger.diff';

export function createEmptyArrayDiff<T = never>(): ArrayDiff<T> {
  return {
    deleted: [],
    created: [],
    changed: [],
    unchanged: []
  };
}
