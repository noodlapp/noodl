// ------------------------------------------------------------------------------
// Model
// ------------------------------------------------------------------------------
function Model(id, data) {
  this.id = id;
  this.data = data;
}

const models = (Model._models = {});
const proxies = {};

// Get and set proxy
const _modelProxyHandler = {
  get: function (target, prop, receiver) {
    if (typeof target[prop] === 'function') return target[prop].bind(target);
    else if (prop in target) return Reflect.get(target, prop, receiver);
    else return target.get(prop);
  },
  set: function (obj, prop, value) {
    if (prop === '_class') {
      obj._class = value;
    } else if (prop === 'id') {
      console.log(`Noodl.Object warning: id is readonly (Id is ${obj.id}, trying to set to ${value})`);
      return true; //if a proxy doesn't return true an exception will be thrown
    } else {
      obj.set(prop, value);
    }
    return true;
  },
  ownKeys(target) {
    return Reflect.ownKeys(target.data);
  },
  getOwnPropertyDescriptor(target, prop) {
    return Object.getOwnPropertyDescriptor(target.data, prop);
  }
};

/**
 *
 * @param {*} id
 * @returns {Model}
 */
Model.get = function (id) {
  if (id === undefined) id = Model.guid();
  if (!models[id]) {
    models[id] = new Model(id, {});
    proxies[id] = new Proxy(models[id], _modelProxyHandler);
  }
  return proxies[id];
};

Model.create = function (data) {
  var modelData = data ? data : {};
  var m = Model.get(modelData.id);
  for (var key in modelData) {
    if (key === 'id') continue;
    m.set(key, modelData[key]);
  }

  return m;
};

Model.exists = function (id) {
  return models[id] !== undefined;
};

Model.instanceOf = function (collection) {
  return collection instanceof Model || collection.target instanceof Model;
};

function _randomString(size) {
  if (size === 0) {
    throw new Error('Zero-length randomString is useless.');
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789';
  let objectId = '';
  for (let i = 0; i < size; ++i) {
    objectId += chars[Math.floor((1 + Math.random()) * 0x10000) % chars.length];
  }
  return objectId;
}

Model.guid = function guid() {
  return _randomString(10);
};

Model.prototype.on = function (event, listener) {
  if (!this.listeners) this.listeners = {};
  if (!this.listeners[event]) this.listeners[event] = [];
  this.listeners[event].push(listener);
};

Model.prototype.off = function (event, listener) {
  if (!this.listeners) return;
  if (!this.listeners[event]) return;
  var idx = this.listeners[event].indexOf(listener);
  if (idx !== -1) this.listeners[event].splice(idx, 1);
};

Model.prototype.notify = function (event, args) {
  if (!this.listeners) return;
  if (!this.listeners[event]) return;

  var l = this.listeners[event].slice(); //clone in case listeners array is modified in the callbacks
  for (var i = 0; i < l.length; i++) {
    l[i](args);
  }
};

Model.prototype.setAll = function (obj) {
  for (var i in obj) {
    if (i === 'id') continue; // Skip id
    if (this.data[i] !== obj[i]) {
      var old = this.data[i];
      this.data[i] = obj[i];
      this.notify('change', { name: i, value: obj[i], old: old });
    }
  }
};

Model.prototype.fill = function (value = null) {
  for (const key in this.data) {
    if (key === 'id') continue; // Skip id
    const temp = this.data[key];
    this.data[key] = value;
    this.notify('change', { name: key, value: this.data[key], old: temp });
  }
};

/**
 * @param {string} name
 * @param {unknown} value
 * @param {{
 *  resolve?: boolean;
 *  forceChange?: boolean;
 *  silent?: boolean;
 * }} args
 */
Model.prototype.set = function (name, value, args) {
  if (args && args.resolve && name.indexOf('.') !== -1) {
    // We should resolve path references
    const path = name.split('.');
    let model = this;
    for (let i = 0; i < path.length - 1; i++) {
      const v = model.get(path[i]);
      if (Model.instanceOf(v)) model = v;
      else return; // Path resolve failed
    }
    model.set(path[path.length - 1], value);
    return;
  }

  const forceChange = args && args.forceChange;

  const oldValue = this.data[name];
  this.data[name] = value;

  if ((forceChange || oldValue !== value) && (!args || !args.silent)) {
    this.notify('change', { name: name, value: value, old: oldValue });
  }
};

/**
 * @returns {string}
 */
Model.prototype.getId = function () {
  return this.id;
};

/**
 * @param {string} name
 * @param {{
 *  resolve?: boolean;
 * }} args
 * @returns {unknown}
 */
Model.prototype.get = function (name, args) {
  if (args && args.resolve && name.indexOf('.') !== -1) {
    // We should resolve path references
    const path = name.split('.');
    let model = this;
    for (let i = 0; i < path.length - 1; i++) {
      const v = model.get(path[i]);
      if (Model.instanceOf(v)) model = v;
      else return; // Path resolve failed
    }
    return model.get(path[path.length - 1]);
  }

  return this.data[name];
};

Model.prototype.toJSON = function () {
  return Object.assign({}, this.data, { id: this.id });
};

Model.Scope = function () {
  this.models = {};
  this.proxies = {};
};

Model.Scope.prototype.get = function (id) {
  if (id === undefined) id = Model.guid();
  if (!this.models[id]) {
    this.models[id] = new Model(id, {});
    this.proxies[id] = new Proxy(this.models[id], _modelProxyHandler);
  }
  return this.proxies[id];
};

Model.Scope.prototype.create = function (data) {
  var modelData = data ? data : {};
  var m = this.get(modelData.id);
  for (var key in modelData) {
    if (key === 'id') continue;
    m.set(key, modelData[key]);
  }

  return m;
};

Model.Scope.prototype.exists = function (id) {
  return this.models[id] !== undefined;
};

Model.Scope.prototype.instanceOf = function (collection) {
  return collection instanceof Model || collection.target instanceof Model;
};

Model.Scope.prototype.guid = function guid() {
  return _randomString(10);
};

Model.Scope.prototype.reset = function () {
  this.models = {};
  this.proxies = {};
  delete this._cloudStore;
};

module.exports = Model;
