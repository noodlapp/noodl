'use strict';

function EventSender() {
  this.listeners = {};
  this.listenersWithRefs = {};
}

EventSender.prototype.on = function (eventName, callback, ref) {
  if (ref) {
    if (!this.listenersWithRefs.hasOwnProperty(eventName)) {
      this.listenersWithRefs[eventName] = new Map();
    }

    if (!this.listenersWithRefs[eventName].get(ref)) {
      this.listenersWithRefs[eventName].set(ref, []);
    }

    this.listenersWithRefs[eventName].get(ref).push(callback);
  } else {
    if (!this.listeners.hasOwnProperty(eventName)) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(callback);
  }
};

EventSender.prototype.removeListenersWithRef = function (ref) {
  Object.keys(this.listenersWithRefs).forEach((eventName) => {
    const listeners = this.listenersWithRefs[eventName];
    if (listeners.has(ref)) {
      listeners.delete(ref);
    }
  });
};

EventSender.prototype.removeAllListeners = function (eventName) {
  if (eventName) {
    delete this.listeners[eventName];
    delete this.listenersWithRefs[eventName];
  } else {
    this.listeners = {};
    this.listenersWithRefs = {};
  }
};

EventSender.prototype.emit = async function (eventName, data) {
  const array = this.listeners[eventName];

  if (array) {
    for (let i = 0; i < array.length; i++) {
      const callback = array[i];
      await Promise.resolve(callback.call(null, data));
    }
  }

  const map = this.listenersWithRefs[eventName];

  if (map) {
    for (const [ref, callbacks] of map) {
      for (const callback of callbacks) {
        await Promise.resolve(callback.call(ref, data));
      }
    }
  }
};

module.exports = EventSender;
