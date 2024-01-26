export class EventDispatcher {
  listeners: any[];

  constructor() {
    this.listeners = [];
  }

  on(event: string | string[], listener, group: unknown) {
    this.listeners.push({ event: event, listener: listener, group: group });
  }

  notifyListeners(event: string, args?) {
    const testForComps = event.split('.');

    function notify(event, listener, eventName) {
      const comps = event.split('.');
      if (comps[0] === testForComps[0] && (comps[1] === '*' || comps[1] === testForComps[1])) listener(args, eventName);
    }

    for (const i in this.listeners) {
      if (this.listeners[i].event instanceof Array) {
        for (const j in this.listeners[i].event) notify(this.listeners[i].event[j], this.listeners[i].listener, event);
      } else {
        notify(this.listeners[i].event, this.listeners[i].listener, event);
      }
    }
  }

  emit(event: string, args?) {
    this.notifyListeners(event, args);
  }

  off(group: unknown) {
    if (group === undefined) return;

    for (let i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i].group === group) {
        this.listeners.splice(i, 1);
        i--;
      }
    }
  }

  static instance = new EventDispatcher();
}
