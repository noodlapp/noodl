'use strict';

var Model = require('./model');

// Get and set proxy
/*const proxies = {}
const _collectionProxyHandler = {
  get: function(target,prop,receiver) {
    if(typeof target[prop] === 'function')
      return target[prop].bind(target);
    else if(prop === 'length')
      return target.size()
    else if(target.items[prop] !== undefined)
      return target.get(prop)
    else
      return Reflect.get(target,prop,receiver)
  },
  set: function(obj,prop,value) {
    if(prop === 'id') {
      console.log(`Noodl.Object warning: id is readonly (Id is ${obj.id}, trying to set to ${value})`);
      return true; //if a proxy doesn't return true an exception will be thrown
    }
    else
      return Reflect.set(target,prop,receiver)
  }
}

function Collection(id) {
  this.id = id;
  this.items = [];
}

var collections = Collection._collections = {};

Collection.create = function(items) {
  const name = Model.guid();
  collections[name] = new Collection(name);
  if(items) {
    collections[name].set(items);
  }
  return collections[name];
}

Collection.get = function(name) {
  if(name === undefined) name = Model.guid();
  if(!collections[name]) {
    collections[name] = new Collection(name);
    proxies[name] = new Proxy(collections[name],_collectionProxyHandler);
  }
  return proxies[name];
}

Collection.instanceOf = function(collection) {
  return collection && (collection instanceof Collection || collection.target instanceof Collection);
}

Collection.exists = function(name) {
  return collections[name] !== undefined;
}

Collection.prototype.getId = function() {
  return this.id;
}

Collection.prototype.on = function(event,listener) {
  if(!this.listeners) this.listeners = {};
  if(!this.listeners[event]) this.listeners[event] = [];
  this.listeners[event].push(listener);
}

Collection.prototype.off = function(event,listener) {
  if(!this.listeners) return;
  if(!this.listeners[event]) return;
  var idx = this.listeners[event].indexOf(listener);
  if(idx!==-1) this.listeners[event].splice(idx,1);
}

Collection.prototype.notify = async function(event,args) {
  if(!this.listeners) return;
  if(!this.listeners[event]) return;
  
  var l = this.listeners[event].slice(); //clone in case listeners array is modified in the callbacks
  for(var i = 0; i < l.length; i++) {
    await l[i](args);
  }  
}

Collection.prototype.set = function(src) {
  var length,i;
  
  if(src === this) return;
  
  function keyIndex(a) {
    var keys = {};
    var length = a.length;
    for(var i = 0; i < length; i++) {   
      var item = a[i];  
      keys[item.getId()] = item;
    }
    return keys;
  }
  
  // Src can be a collection, or an array
  var src = Collection.instanceOf(src)?src.items:src;
  var bItems = [];
  length = src.length;
  for(i = 0; i < length; i++) {
    var item = src[i];
    if(Model.instanceOf(item))
      bItems.push(item);
    else
      bItems.push(Model.create(item));
  }
  
  var aItems = this.items;  
  var aKeys = keyIndex(aItems);
  var bKeys = keyIndex(bItems);
  
  // First remove all items not in the new collection
  length = aItems.length;
  for(i = 0; i < length; i++) {
    if(!bKeys.hasOwnProperty(aItems[i].getId())) {
      // This item is not present in new collection, remove it
      this.removeAtIndex(i);
      i--;
      length--;
    }
  }
  
  // Reorder items
  for(i = 0; i < Math.min(aItems.length,bItems.length); i++) {
    if(aItems[i] !== bItems[i]) {
      if(aKeys.hasOwnProperty(bItems[i].getId())) { 
        // The bItem exist in the collection but is in the wrong place
        this.remove(bItems[i]);
      }

      // This is a new item, add it at correct index
      this.addAtIndex(bItems[i],i);
    }  
  }
  
  // Add remaining items
  for(i = aItems.length; i < bItems.length; i++) {
    this.add(bItems[i]);
  }
      
}

Collection.prototype.contains = function(item) {
  return this.items.indexOf(item)!==-1;
}

Collection.prototype.add = async function(item) {
  if(this.contains(item)) return; // Already contains item
  
  this.items.push(item);
  await this.notify('add',{item:item,index:this.items.length-1});
  await this.notify('change');
  await item.notify('add',{collection:this});
}

Collection.prototype.addAtIndex = async function(item,index) {
  if(this.contains(item)) return; // Already contains item

  this.items.splice(index,0,item);
  await this.notify('add',{item:item,index:index});
  await this.notify('change');
  await item.notify('add',{collection:this,index:index});
}

Collection.prototype.removeAtIndex = async function(idx) {
  var item = this.items[idx];
  this.items.splice(idx,1);
  await this.notify('remove',{item:item,index:idx});
  await this.notify('change');
  await item.notify('remove',{collection:this});  
}

Collection.prototype.remove = function(item) {
  var idx = this.items.indexOf(item);
  if(idx !== -1) this.removeAtIndex(idx);
}

Collection.prototype.size = function() {
  return this.items.length;
}

Collection.prototype.get = function(index) {
  return this.items[index];
}

Collection.prototype.each = function(callback) {
  for(var i = 0; i < this.items.length; i++) {
    callback(this.items[i],i);
  }
}

Collection.prototype.forEach = Collection.prototype.each;

Collection.prototype.map = function(fn) {
  return this.items.map(fn);
}

Collection.prototype.filter = function(fn) {
  return this.items.filter(fn);
}

Collection.prototype.find = function(predicate, thisArg) {
  return this.items.find(predicate, thisArg);
}

Collection.prototype.findIndex = function(predicate, thisArg) {
  return this.items.findIndex(predicate, thisArg);
}   

Collection.prototype.toJSON = function() {
  return this.map(function(m) {
      return m.toJSON()
  })
}*/

// ----
Object.defineProperty(Array.prototype, 'items', {
  enumerable: false,
  get() {
    return this;
  },
  set(data) {
    this.set(data);
  }
});
Object.defineProperty(Array.prototype, 'each', {
  enumerable: false,
  writable: false,
  value: Array.prototype.forEach
});
Object.defineProperty(Array.prototype, 'size', {
  enumerable: false,
  writable: false,
  value: function () {
    return this.length;
  }
});
Object.defineProperty(Array.prototype, 'get', {
  enumerable: false,
  writable: false,
  value: function (index) {
    return this[index];
  }
});
Object.defineProperty(Array.prototype, 'getId', {
  enumerable: false,
  writable: false,
  value: function () {
    return this._id;
  }
});
Object.defineProperty(Array.prototype, 'id', {
  enumerable: false,
  get() {
    return this.getId();
  }
});
Object.defineProperty(Array.prototype, 'set', {
  enumerable: false,
  writable: false,
  value: function (src) {
    var length, i;

    if (src === this) return;

    src = src || []; //handle if src is undefined

    function keyIndex(a) {
      var keys = {};
      var length = a.length;
      for (var i = 0; i < length; i++) {
        var item = a[i];
        keys[item.getId()] = item;
      }
      return keys;
    }

    // Src can be a collection, or an array
    var bItems = [];
    length = src.length;
    for (i = 0; i < length; i++) {
      var item = src[i];
      if (Model.instanceOf(item)) bItems.push(item);
      else bItems.push(Model.create(item));
    }

    var aItems = this.items;
    var aKeys = keyIndex(aItems);
    var bKeys = keyIndex(bItems);

    // First remove all items not in the new collection
    length = aItems.length;
    for (i = 0; i < length; i++) {
      if (!bKeys.hasOwnProperty(aItems[i].getId())) {
        // This item is not present in new collection, remove it
        this.removeAtIndex(i);
        i--;
        length--;
      }
    }

    // Reorder items
    for (i = 0; i < Math.min(aItems.length, bItems.length); i++) {
      if (aItems[i] !== bItems[i]) {
        if (aKeys.hasOwnProperty(bItems[i].getId())) {
          // The bItem exist in the collection but is in the wrong place
          this.remove(bItems[i]);
        }

        // This is a new item, add it at correct index
        this.addAtIndex(bItems[i], i);
      }
    }

    // Add remaining items
    for (i = aItems.length; i < bItems.length; i++) {
      this.add(bItems[i]);
    }
  }
});

Object.defineProperty(Array.prototype, 'notify', {
  enumerable: false,
  writable: false,
  value: async function (event, args) {
    if (!this._listeners) return;
    if (!this._listeners[event]) return;

    var l = this._listeners[event].slice(); //clone in case listeners array is modified in the callbacks
    for (var i = 0; i < l.length; i++) {
      await l[i](args);
    }
  }
});

Object.defineProperty(Array.prototype, 'contains', {
  enumerable: false,
  writable: false,
  value: function (item) {
    return this.indexOf(item) !== -1;
  }
});

Object.defineProperty(Array.prototype, 'add', {
  enumerable: false,
  writable: false,
  value: async function (item) {
    if (this.contains(item)) return; // Already contains item

    this.items.push(item);
    await this.notify('add', { item: item, index: this.items.length - 1 });
    await this.notify('change');
    await item.notify('add', { collection: this });
  }
});

Object.defineProperty(Array.prototype, 'remove', {
  enumerable: false,
  writable: false,
  value: function (item) {
    var idx = this.items.indexOf(item);
    if (idx !== -1) this.removeAtIndex(idx);
  }
});

Object.defineProperty(Array.prototype, 'addAtIndex', {
  enumerable: false,
  writable: false,
  value: async function (item, index) {
    if (this.contains(item)) return; // Already contains item

    this.items.splice(index, 0, item);
    await this.notify('add', { item: item, index: index });
    await this.notify('change');
    await item.notify('add', { collection: this, index: index });
  }
});

Object.defineProperty(Array.prototype, 'removeAtIndex', {
  enumerable: false,
  writable: false,
  value: async function (idx) {
    var item = this.items[idx];
    this.items.splice(idx, 1);
    await this.notify('remove', { item: item, index: idx });
    await this.notify('change');
    await item.notify('remove', { collection: this });
  }
});

Object.defineProperty(Array.prototype, 'on', {
  enumerable: false,
  writable: false,
  value: function (event, listener) {
    if (!this._listeners)
      Object.defineProperty(this, '_listeners', {
        enumerable: false,
        writable: false,
        value: {}
      });
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(listener);
  }
});

Object.defineProperty(Array.prototype, 'off', {
  enumerable: false,
  writable: false,
  value: function (event, listener) {
    if (!this._listeners) return;
    if (!this._listeners[event]) return;
    var idx = this._listeners[event].indexOf(listener);
    if (idx !== -1) this._listeners[event].splice(idx, 1);
  }
});

class Collection extends Array {}

const collections = (Collection._collections = {});

Collection.create = function (items) {
  const name = Model.guid();
  collections[name] = new Collection();
  Object.defineProperty(collections[name], '_id', {
    enumerable: false,
    writable: false,
    value: name
  });
  if (items) {
    collections[name].set(items);
  }
  return collections[name];
};

/**
 * @param {string} name
 * @returns {Collection}
 */
Collection.get = function (name) {
  if (name === undefined) name = Model.guid();
  if (!collections[name]) {
    collections[name] = new Collection();
    Object.defineProperty(collections[name], '_id', {
      enumerable: false,
      writable: false,
      value: name
    });
  }

  return collections[name];
};

Collection.instanceOf = function (collection) {
  return collection instanceof Collection;
};

Collection.exists = function (name) {
  return collections[name] !== undefined;
};

module.exports = Collection;
