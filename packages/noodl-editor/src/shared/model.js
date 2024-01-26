const { EventDispatcher } = require('./utils/EventDispatcher');

var Model = function () {
  this.listeners = [];
  this.listenersOnce = [];
};

Model._listenersEnabled = true;

Model.prototype.on = function (event, listener, group) {
  this.listeners.push({
    event: event,
    listener: listener,
    group: group
  });

  if (this.listeners.length > 10000) {
    console.log('Warning: we have more that 10000 listeners on this model, is this sane?');
  }

  return this;
};

Model.prototype.once = function (event, listener) {
  this.listenersOnce.push({
    event: event,
    listener: listener
  });

  return this;
};

Model.prototype.set = function (args) {
  for (var i in args) this[i] = args[i];
  this.notifyListeners('change', {
    model: this
  });
};

function shouldNotify(l, event) {
  if (l.event.constructor == Array && l.event.indexOf(event) !== -1) {
    return true;
  } else if (l.event === event) {
    return true;
  } else if (l.event.indexOf !== undefined) {
    // Support for dot notation in subscription
    var index = l.event.indexOf(event);
    if (index > 0 && l.event[index - 1] === '.') {
      return true;
    }
  }
  return false;
}

Model.prototype.notifyListeners = function (event, args) {
  if (Model._listenersEnabled === false) return;

  for (let index = 0; index < this.listeners.length; index++) {
    const listener = this.listeners[index];
    if (shouldNotify(listener, event)) {
      listener.listener(args);
    }
  }

  if (this.listenersOnce.length > 0) {
    this.listenersOnce = this.listenersOnce.filter((listener) => {
      if (shouldNotify(listener, event)) {
        listener.listener(args);
        return false;
      }
      return true;
    });
  }

  // Dispatch global event
  EventDispatcher.instance.notifyListeners('Model.' + event, {
    model: this,
    args: args
  });

  return this;
};

Model.prototype.off = function (group) {
  for (var i = 0; i < this.listeners.length; i++) {
    if (this.listeners[i].group === group) {
      this.listeners.splice(i, 1);
      i--;
    }
  }

  return this;
};

Model.prototype.removeAllListeners = function () {
  this.listeners = [];
  this.listenersOnce = [];
};

module.exports = Model;
