const NoodlRuntime = require('../../noodl-runtime');
const Model = require('../model');
const Collection = require('../collection');
const CloudFile = require('./cloudfile');
const EventEmitter = require('../events');

const _protectedFields = {
  _common: ['_createdAt', '_updatedAt', 'objectId'],
  _User: ['_email_verify_token']
};

function _removeProtectedFields(data, className) {
  const _data = Object.assign({}, data);
  _protectedFields._common.forEach((f) => delete _data[f]);
  if (className && _protectedFields[className]) _protectedFields[className].forEach((f) => delete _data[f]);

  return _data;
}

class CloudStore {
  constructor(modelScope) {
    this._initCloudServices();

    this.events = new EventEmitter();
    this.events.setMaxListeners(10000);
    this.modelScope = modelScope;

    this._fromJSON = (item, collectionName) => CloudStore._fromJSON(item, collectionName, modelScope);
    this._deserializeJSON = (data, type) => CloudStore._deserializeJSON(data, type, modelScope);
    this._serializeObject = (data, collectionName) => CloudStore._serializeObject(data, collectionName, modelScope);
  }

  _initCloudServices() {
    _collections = undefined; // clear collection cache, so it's refetched

    const cloudServices = NoodlRuntime.instance.getMetaData('cloudservices');
    if (cloudServices) {
      this.appId = cloudServices.appId;
      this.endpoint = cloudServices.endpoint;
    }

    const dbVersionMajor = NoodlRuntime.instance.getMetaData('dbVersionMajor');
    this.dbVersionMajor = dbVersionMajor;
  }

  on() {
    this.events.on.apply(this.events, arguments);
  }

  off() {
    this.events.off.apply(this.events, arguments);
  }

  _makeRequest(path, options) {
    if (typeof _noodl_cloud_runtime_version === 'undefined') {
      // Running in browser
      var xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          var json;
          try {
            // In SSR, we dont have xhr.response
            json = JSON.parse(xhr.response || xhr.responseText);
          } catch (e) {}

          if (xhr.status === 200 || xhr.status === 201) {
            options.success(json);
          } else options.error(json || { error: xhr.responseText, status: xhr.status });
        }
      };

      xhr.open(options.method || 'GET', this.endpoint + path, true);

      xhr.setRequestHeader('X-Parse-Application-Id', this.appId);
      if (typeof _noodl_cloudservices !== 'undefined') {
        xhr.setRequestHeader('X-Parse-Master-Key', _noodl_cloudservices.masterKey);
      }

      // Check for current users
      var _cu = localStorage['Parse/' + this.appId + '/currentUser'];
      if (_cu !== undefined) {
        try {
          const currentUser = JSON.parse(_cu);
          xhr.setRequestHeader('X-Parse-Session-Token', currentUser.sessionToken);
        } catch (e) {
          // Failed to extract session token
        }
      }

      if (options.onUploadProgress) {
        xhr.upload.onprogress = (pe) => options.onUploadProgress(pe);
      }

      if (options.content instanceof File) {
        xhr.send(options.content);
      } else {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(options.content));
      }
    } else {
      // Running in cloud runtime
      const endpoint = typeof _noodl_cloudservices !== 'undefined' ? _noodl_cloudservices.endpoint : this.endpoint;
      const appId = typeof _noodl_cloudservices !== 'undefined' ? _noodl_cloudservices.appId : this.appId;
      const masterKey = typeof _noodl_cloudservices !== 'undefined' ? _noodl_cloudservices.masterKey : undefined;

      fetch(endpoint + path, {
        method: options.method || 'GET',
        headers: {
          'X-Parse-Application-Id': appId,
          'X-Parse-Master-Key': masterKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options.content)
      })
        .then((r) => {
          if (r.status === 200 || r.status === 201) {
            if (options.method === 'DELETE') {
              options.success(undefined);
            } else {
              r.json()
                .then((json) => options.success(json))
                .catch((e) =>
                  options.error({
                    error: 'CloudStore: Failed to get json result.'
                  })
                );
            }
          } else {
            if (options.method === 'DELETE') {
              options.error({ error: 'Failed to delete.' });
            } else {
              r.json()
                .then((json) => options.error(json))
                .catch((e) => options.error({ error: 'Failed to fetch.' }));
            }
          }
        })
        .catch((e) => {
          options.error({ error: e.message });
        });
    }
  }

  query(options) {
    this._makeRequest('/classes/' + options.collection, {
      method: 'POST',
      content: {
        _method: 'GET',
        where: options.where,
        limit: options.limit,
        skip: options.skip,
        include: Array.isArray(options.include) ? options.include.join(',') : options.include,
        keys: Array.isArray(options.select) ? options.select.join(',') : options.select,
        order: Array.isArray(options.sort) ? options.sort.join(',') : options.sort,
        count: options.count
      },
      success: function (response) {
        options.success(response.results, response.count);
      },
      error: function () {
        options.error();
      }
    });
  }

  aggregate(options) {
    const args = [];

    if (!options.group) {
      options.error('You need to provide group option.');
      return;
    }

    if (options.limit) args.push('limit=' + options.limit);
    if (options.skip) args.push('skip=' + options.skip);

    const grouping = {};

    Object.keys(options.group).forEach((k) => {
      const _g = {};
      const group = options.group[k];
      if (group['avg'] !== undefined) _g['$avg'] = '$' + group['avg'];
      else if (group['sum'] !== undefined) _g['$sum'] = '$' + group['sum'];
      else if (group['max'] !== undefined) _g['$max'] = '$' + group['max'];
      else if (group['min'] !== undefined) _g['$min'] = '$' + group['min'];
      else if (group['distinct'] !== undefined) _g['$addToSet'] = '$' + group['distinct'];

      grouping[k] = _g;
    });

    // I don't know which version the API was changed, lets just say above 4 for now.
    if (this.dbVersionMajor && this.dbVersionMajor > 4) {
      grouping._id = null;

      if (options.where) args.push('$match=' + encodeURIComponent(JSON.stringify(options.where)));

      args.push('$group=' + JSON.stringify(grouping));
    } else {
      grouping.objectId = null;

      if (options.where) args.push('match=' + encodeURIComponent(JSON.stringify(options.where)));

      args.push('group=' + JSON.stringify(grouping));
    }

    this._makeRequest('/aggregate/' + options.collection + (args.length > 0 ? '?' + args.join('&') : ''), {
      success: function (response) {
        const res = {};

        if (!response.results || response.results.length !== 1) {
          options.success({}); // No result
          return;
        }

        Object.keys(options.group).forEach((k) => {
          res[k] = response.results[0][k];
        });

        options.success(res);
      },
      error: function () {
        options.error();
      }
    });
  }

  count(options) {
    const args = [];

    if (options.where) args.push('where=' + encodeURIComponent(JSON.stringify(options.where)));
    args.push('limit=0');
    args.push('count=1');

    this._makeRequest('/classes/' + options.collection + (args.length > 0 ? '?' + args.join('&') : ''), {
      success: function (response) {
        options.success(response.count);
      },
      error: function () {
        options.error();
      }
    });
  }

  distinct(options) {
    const args = [];

    if (options.where) args.push('where=' + encodeURIComponent(JSON.stringify(options.where)));
    args.push('distinct=' + options.property);

    this._makeRequest('/aggregate/' + options.collection + (args.length > 0 ? '?' + args.join('&') : ''), {
      success: function (response) {
        options.success(response.results);
      },
      error: function () {
        options.error();
      }
    });
  }

  /**
   *
   * @param {{
   *    objectId: string;
   *    collection: string;
   *    keys?: string[] | string;
   *    include?: string[] | string;
   *    excludeKeys?: string[] | string;
   *    success: (data: unknown) => void;
   *    error: (error: unknown) => void;
   * }} options
   */
  fetch(options) {
    const args = [];

    if (options.include) {
      args.push('include=' + (Array.isArray(options.include) ? options.include.join(',') : options.include));
    }

    if (options.keys) {
      args.push('keys=' + (Array.isArray(options.keys) ? options.keys.join(',') : options.keys));
    }

    if (options.excludeKeys) {
      args.push(
        'excludeKeys=' + (Array.isArray(options.excludeKeys) ? options.excludeKeys.join(',') : options.excludeKeys)
      );
    }

    this._makeRequest(
      '/classes/' + options.collection + '/' + options.objectId + (args.length > 0 ? '?' + args.join('&') : ''),
      {
        method: 'GET',
        success: (response) => {
          options.success(response);
          this.events.emit('fetch', {
            type: 'fetch',
            objectId: options.objectId,
            object: response,
            collection: options.collection
          });
        },
        error: function (res) {
          options.error(res.error);
        }
      }
    );
  }

  create(options) {
    this._makeRequest('/classes/' + options.collection, {
      method: 'POST',
      content: Object.assign(
        _removeProtectedFields(_serializeObject(options.data, options.collection), options.collection),
        { ACL: options.acl }
      ),
      success: (response) => {
        const _obj = Object.assign({}, options.data, response);
        options.success(_obj);
        this.events.emit('create', {
          type: 'create',
          objectId: options.objectId,
          object: _obj,
          collection: options.collection
        });
      },
      error: function (res) {
        options.error(res.error);
      }
    });
  }

  increment(options) {
    const data = {};

    for (let key in options.properties) {
      data[key] = { __op: 'Increment', amount: options.properties[key] };
    }

    this._makeRequest('/classes/' + options.collection + '/' + options.objectId, {
      method: 'PUT',
      content: data,
      success: (response) => {
        options.success(response);
      },
      error: function (res) {
        options.error(res.error);
      }
    });
  }

  save(options) {
    const _data = Object.assign({}, options.data);
    delete _data.createdAt;
    delete _data.updatedAt;

    this._makeRequest('/classes/' + options.collection + '/' + options.objectId, {
      method: 'PUT',
      content: Object.assign(_removeProtectedFields(_serializeObject(_data, options.collection), options.collection), {
        ACL: options.acl
      }),
      success: (response) => {
        options.success(response);
        this.events.emit('save', {
          type: 'save',
          objectId: options.objectId,
          object: Object.assign({}, options.data, response),
          collection: options.collection
        });
      },
      error: function (res) {
        options.error(res.error);
      }
    });
  }

  delete(options) {
    this._makeRequest('/classes/' + options.collection + '/' + options.objectId, {
      method: 'DELETE',
      success: () => {
        options.success();
        this.events.emit('delete', {
          type: 'delete',
          objectId: options.objectId,
          collection: options.collection
        });
      },
      error: function (res) {
        options.error(res.error);
      }
    });
  }

  addRelation(options) {
    const _content = {};
    _content[options.key] = {
      __op: 'AddRelation',
      objects: [
        {
          __type: 'Pointer',
          objectId: options.targetObjectId,
          className: options.targetClass
        }
      ]
    };
    this._makeRequest('/classes/' + options.collection + '/' + options.objectId, {
      method: 'PUT',
      content: _content,
      success: function (response) {
        options.success(response);
      },
      error: function (res) {
        options.error(res.error);
      }
    });
  }

  removeRelation(options) {
    const _content = {};
    _content[options.key] = {
      __op: 'RemoveRelation',
      objects: [
        {
          __type: 'Pointer',
          objectId: options.targetObjectId,
          className: options.targetClass
        }
      ]
    };
    this._makeRequest('/classes/' + options.collection + '/' + options.objectId, {
      method: 'PUT',
      content: _content,
      success: function (response) {
        options.success(response);
      },
      error: function (res) {
        options.error(res.error);
      }
    });
  }

  uploadFile(options) {
    this._makeRequest('/files/' + options.file.name, {
      method: 'POST',
      content: options.file,
      contentType: options.file.type,
      success: (response) => options.success(Object.assign({}, options.data, response)),
      error: (err) => options.error(err),
      onUploadProgress: options.onUploadProgress
    });
  }

  /**
   * Users holding the master key are allowed to delete files
   *
   * @param {{
   *    file: {
   *      name: string;
   *    }
   *    success: (data: unknown) => void;
   *    error: (error: unknown) => void;
   * }} options
   */
  deleteFile(options) {
    this._makeRequest('/files/' + options.file.name, {
      method: 'DELETE',
      success: (response) => options.success(Object.assign({}, options.data, response)),
      error: (err) => options.error(err)
    });
  }
}

function _isArrayOfObjects(a) {
  if (!Array.isArray(a)) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (typeof a[i] !== 'object' || a[i] === null) {
      return false;
    }
  }

  return true;
}

function _toJSON(obj) {
  if (obj instanceof Model) {
    var res = {};
    for (var key in obj.data) {
      res[key] = _toJSON(obj.data[key]);
    }
    return res;
  } else if (obj instanceof Collection) {
    var res = [];
    obj.items.forEach((m) => {
      res.push(_toJSON(m));
    });
    return res;
  }
  return obj;
}

function _serializeObject(data, collectionName, modelScope) {
  if (CloudStore._collections[collectionName]) var schema = CloudStore._collections[collectionName].schema;

  for (var key in data) {
    var _type = schema && schema.properties && schema.properties[key] ? schema.properties[key].type : undefined;

    if (data[key] === undefined || data[key] === null) {
      // Keep null and undefined as is
    } else if (_type === 'Pointer' && typeof data[key] === 'string') {
      // This is a string pointer to an object
      data[key] = {
        __type: 'Pointer',
        className: schema.properties[key].targetClass,
        objectId: data[key]
      };
    } else if (_type === 'Pointer' && typeof data[key] === 'object' && (modelScope || Model).instanceOf(data[key])) {
      // This is an embedded object that should be stored as pointer
      data[key] = {
        __type: 'Pointer',
        className: schema.properties[key].targetClass,
        objectId: data[key].getId()
      };
    } else if (_type === 'Date' && (typeof data[key] === 'string' || data[key] instanceof Date)) {
      data[key] = {
        __type: 'Date',
        iso: data[key] instanceof Date ? data[key].toISOString() : data[key]
      };
    } else if (_type === 'File' && data[key] instanceof CloudFile) {
      const cloudFile = data[key];
      data[key] = {
        __type: 'File',
        url: cloudFile.getUrl(),
        name: cloudFile.getName()
      };
    } else if (_type === 'Array' && typeof data[key] === 'string' && Collection.exists(data[key])) {
      data[key] = _toJSON(Collection.get(data[key]));
    } else if (_type === 'Object' && typeof data[key] === 'string' && (modelScope || Model).exists(data[key])) {
      data[key] = _toJSON((modelScope || Model).get(data[key]));
    } else if (_type === 'GeoPoint' && typeof data[key] === 'object') {
      data[key] = {
        __type: 'GeoPoint',
        latitude: Number(data[key].latitude),
        longitude: Number(data[key].longitude)
      };
    } else data[key] = _toJSON(data[key]);
  }

  return data;
}

/**
 *
 * @param {unknown} data
 * @param {string} type
 * @param {*} modelScope
 * @returns
 */
function _deserializeJSON(data, type, modelScope) {
  if (data === undefined) return undefined;
  if (data === null) return null;

  if (type === 'Relation' && data.__type === 'Relation') {
    return undefined; // Ignore relation fields
  }

  // This is a pointer type, resolve into id
  if (type === 'Pointer' && data.__type === 'Pointer') {
    return data.objectId;
  }

  if (type === 'Date' && data.__type === 'Date') {
    return new Date(data.iso);
  }

  if (type === 'Date' && typeof data === 'string') {
    return new Date(data);
  }

  if (type === 'File' && data.__type === 'File') {
    return new CloudFile(data);
  }

  if (type === 'GeoPoint' && data.__type === 'GeoPoint') {
    return {
      latitude: data.latitude,
      longitude: data.longitude
    };
  }

  if (_isArrayOfObjects(data)) {
    const a = [];
    for (let i = 0; i < data.length; i++) {
      a.push(_deserializeJSON(data[i], undefined, modelScope));
    }
    const c = Collection.get();
    c.set(a);
    return c;
  }

  // An array with mixed types
  if (Array.isArray(data)) {
    return data;
  }

  // This is an array with mixed data, just return it
  if (data && data.__type === 'Object' && data.className !== undefined && data.objectId !== undefined) {
    const _data = Object.assign({}, data);
    delete _data.className;
    delete _data.__type;
    return _fromJSON(_data, data.className, modelScope);
  }

  if (typeof data === 'object' && data !== null) {
    // Try to get the model by id, if it is defined, otherwise we create a new unique id.
    const model = (modelScope || Model).get(data.id);
    for (const key in data) {
      const nestedValue = _deserializeJSON(data[key], undefined, modelScope);
      model.set(key, nestedValue);
    }
    return model;
  }

  return data;
}

function _fromJSON(item, collectionName, modelScope) {
  const modelStore = modelScope || Model;

  // Try to get the model by the object id (record) or id, otherwise we create a new unique id.
  const model = modelStore.get(item.objectId || item.id);
  model._class = collectionName;

  let schema = undefined;
  if (collectionName !== undefined && CloudStore._collections[collectionName] !== undefined) {
    schema = CloudStore._collections[collectionName].schema;
  }

  for (const key in item) {
    if (key === 'objectId' || key === 'ACL') {
      continue;
    }

    const _type = schema && schema.properties && schema.properties[key] ? schema.properties[key].type : undefined;
    const nestedValue = _deserializeJSON(item[key], _type, modelScope);
    model.set(key, nestedValue);
  }

  return model;
}

CloudStore._fromJSON = _fromJSON;
CloudStore._deserializeJSON = _deserializeJSON;
CloudStore._serializeObject = _serializeObject;

CloudStore.forScope = (modelScope) => {
  if (modelScope === undefined) return CloudStore.instance;
  if (modelScope._cloudStore) return modelScope._cloudStore;

  modelScope._cloudStore = new CloudStore(modelScope);
  return modelScope._cloudStore;
};

var _instance;
Object.defineProperty(CloudStore, 'instance', {
  get: function () {
    if (_instance === undefined) _instance = new CloudStore();
    return _instance;
  }
});

var _collections;
Object.defineProperty(CloudStore, '_collections', {
  get: function () {
    if (_collections === undefined) {
      _collections = {};
      const dbCollections = NoodlRuntime.instance.getMetaData('dbCollections') || [];
      dbCollections.forEach((c) => {
        _collections[c.name] = c;
      });

      const systemCollections = NoodlRuntime.instance.getMetaData('systemCollections') || [];
      systemCollections.forEach((c) => {
        _collections[c.name] = c;
      });
    }
    return _collections;
  }
});

CloudStore.invalidateCollections = () => {
  _collections = undefined;
};

module.exports = CloudStore;
