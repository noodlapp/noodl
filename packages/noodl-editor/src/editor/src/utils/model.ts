import { default as SharedModel } from '../../../shared/model';
import { EventDispatcher } from '../../../shared/utils/EventDispatcher';

export type ModelEventEnum = string | number | symbol;
export type ModelEvents<TEnum extends ModelEventEnum> = {
  [P in TEnum]: (...args: any) => any;
};

export type ModelGroup = unknown;

/**
 * Modern version of the old Model class.
 *
 * @example
 *  export enum Test {
 *    A = 'A',
 *    B = 'B'
 *  }
 *
 *  export type TestEvents = {
 *    [Test.A]: () => void;
 *    [Test.B]: (v: number) => void;
 *  };
 *
 *  export const myModelExample: IModel<Test, TestEvents>;
 *  myModelExample.on(Test.A, () => {});
 *  myModelExample.on(Test.B, (v) => {
 *    // typeof v === "number"
 *  });
 */
export interface IModel<TEnum extends ModelEventEnum, TEvents extends ModelEvents<TEnum>> {
  /**
   *
   * @param event
   * @param listener
   * @param group
   */
  on<T extends TEnum>(
    event: T,
    listener: (...args: Parameters<TEvents[T]>) => void,
    group?: ModelGroup
  ): ThisType<this>;

  /**
   *
   * @param event
   * @param listener
   */
  once<T extends TEnum>(event: T, listener: (...args: Parameters<TEvents[T]>) => void): ThisType<this>;

  /**
   *
   * @param group
   */
  off(group: ModelGroup): ThisType<this>;

  /**
   *
   * @param event
   * @param args
   */
  notifyListeners<T extends TEnum>(event: T, ...args: Parameters<TEvents[T]>): ThisType<this>;

  /**
   *
   */
  removeAllListeners(): void;
}

function shouldNotify(l: any, event: any) {
  if (l.event.constructor == Array && l.event.indexOf(event) !== -1) {
    return true;
  } else if (l.event === '*') {
    return true;
  } else if (l.event === event) {
    return true;
  } else if (l.event.indexOf !== undefined) {
    // Support for dot notation in subscription
    const index = l.event.indexOf(event);
    if (index > 0 && l.event[index - 1] === '.') {
      return true;
    }
  }
  return false;
}

export class Model<TEnum extends ModelEventEnum = any, TEvents extends ModelEvents<TEnum> = any>
  implements IModel<TEnum, TEvents>
{
  private listeners: any[];
  private listenersOnce: any[];

  constructor() {
    this.listeners = [];
    this.listenersOnce = [];
  }

  on<T extends TEnum>(event: T, listener: (...args: Parameters<TEvents[T]>) => void, group?: unknown): ThisType<this> {
    this.listeners.push({
      event: event,
      listener: listener,
      group: group
    });

    if (this.listeners.length > 10000) {
      console.log('Warning: we have more that 10000 listeners on this model, is this sane?');
    }

    return this;
  }

  once<T extends TEnum>(event: T, listener: (...args: Parameters<TEvents[T]>) => void): ThisType<this> {
    this.listenersOnce.push({
      event: event,
      listener: listener
    });

    return this;
  }

  off(group: unknown): ThisType<this> {
    for (let i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i].group === group) {
        this.listeners.splice(i, 1);
        i--;
      }
    }

    return this;
  }

  notifyListeners<T extends TEnum>(event: T, ...args: Parameters<TEvents[T]>): ThisType<this> {
    if (SharedModel._listenersEnabled === false) return;

    for (let index = 0; index < this.listeners.length; index++) {
      const listener = this.listeners[index];
      if (shouldNotify(listener, event)) {
        // @ts-expect-error
        listener.listener(...args);
      }
    }

    if (this.listenersOnce.length > 0) {
      this.listenersOnce = this.listenersOnce.filter((listener) => {
        if (shouldNotify(listener, event)) {
          // @ts-expect-error
          listener.listener(...args);
          return false;
        }
        return true;
      });
    }

    // Dispatch global event
    EventDispatcher.instance.notifyListeners('Model.' + event.toString(), {
      model: this,
      args: args
    });

    return this;
  }

  removeAllListeners(): void {
    this.listeners = [];
    this.listenersOnce = [];
  }
}
