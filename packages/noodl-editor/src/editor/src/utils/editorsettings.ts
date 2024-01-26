import { JSONStorage } from '@noodl/platform';
import Model from '../../../shared/model';
import _ from 'underscore';

function deepMerge(dest, source) {
  for (const prop in source) {
    const sourceVal = source[prop];
    const destVal = dest[prop];
    if (prop in dest && _.isObject(sourceVal) && _.isObject(destVal)) {
      deepMerge(destVal, sourceVal);
    } else {
      dest[prop] = sourceVal;
    }
  }
  return dest;
}

function debounce(func, timeout = 300) {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(func, timeout);
  };
}

export class EditorSettings extends Model {
  public static instance = new EditorSettings();

  private settings: TSFixme;
  private debouncedStore: () => void;

  constructor() {
    super();
    this.settings = {};
    this.fetch();

    this.debouncedStore = debounce(() => this.store(), 1000);
  }

  async fetch() {
    const local = await JSONStorage.get('editorSettings');
    this.settings = local.settings || {};
  }

  async store() {
    await JSONStorage.set('editorSettings', { settings: this.settings });
  }

  // @ts-expect-error Property 'set' in type 'EditorSettings' is not assignable to the same property in base type 'Model'.
  set(key: string, data) {
    this.settings[key] = data;
    this.debouncedStore();

    this.notifyListeners(`updated`, { key });
  }

  setMerge(key: string, data) {
    this.settings[key] = deepMerge(this.settings[key] || {}, data);
    this.debouncedStore();
  }

  get(key: string) {
    return this.settings[key];
  }
}
