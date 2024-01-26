class SchemaModel {
  constructor(args) {
    this.appId = args.appId;
    this.endpoint = args.endpoint || args.url;
    this.masterKey = args.masterKey;
  }

  _makeRequest(path, options) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        var json;
        try {
          json = JSON.parse(xhr.response);
        } catch (e) {}

        if (xhr.status === 200 || xhr.status === 201) {
          options.success(json);
        } else {
          options.error(json);
        }
      }
    };

    xhr.open(options.method || 'GET', this.endpoint + path, true);

    xhr.setRequestHeader('X-Parse-Application-Id', this.appId);
    xhr.setRequestHeader('X-Parse-MASTER-Key', this.masterKey);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(JSON.stringify(options.content));
  }

  listSchemas(options) {
    this._makeRequest('/schemas', {
      success: function (response) {
        const _result = response.results;

        options.success(
          _result.map((schema) => {
            delete schema.fields.objectId;
            delete schema.fields.ACL;

            return {
              name: schema.className,
              fields: schema.fields
            };
          })
        );
      },
      error: function (res) {
        options.error(res);
      }
    });
  }

  getConfigSchema(options) {
    function _typeForValue(v) {
      if (typeof v === 'string') {
        return 'string';
      } else if (typeof v === 'number') {
        return 'number';
      } else if (typeof v === 'boolean') {
        return 'boolean';
      } else if (Array.isArray(v)) {
        return 'array';
      } else if (v instanceof Date && typeof v.toISOString === 'function') {
        return 'date';
      } else if (typeof v === 'object') {
        return 'object';
      }
    }

    this._makeRequest('/config', {
      success: function (response) {
        const configSchema = {};
        const params = response.params || {};
        const masterKeyOnly = response.masterKeyOnly || {};
        Object.keys(params).forEach((k) => {
          configSchema[k] = { masterKeyOnly: !!masterKeyOnly[k], type: _typeForValue(params[k]) };
        });

        options.success(configSchema);
      },
      error: function (res) {
        options.error(res);
      }
    });
  }

  createNewSchema(options) {
    this._makeRequest('/schemas/' + options.collection, {
      method: 'POST',
      content: {
        className: options.collection
      },
      success: function (response) {
        options.success();
      },
      error: function (res) {
        options.error(res);
      }
    });
  }

  getSchema(options) {
    this._makeRequest('/schemas/' + options.collection, {
      success: function (schema) {
        delete schema.fields.objectId;
        delete schema.fields.ACL;

        options.success(schema);
      },
      error: function (res) {
        options.error(res);
      }
    });
  }

  addSchemaFields(options) {
    this._makeRequest('/schemas/' + options.collection, {
      method: 'PUT',
      content: {
        className: options.collection,
        fields: options.fields
      },
      success: function (response) {
        options.success();
      },
      error: function (res) {
        options.error(res);
      }
    });
  }

  addSchemaField(options) {
    const fields = {};
    fields[options.field] = { type: options.type };
    this._makeRequest('/schemas/' + options.collection, {
      method: 'PUT',
      content: {
        className: options.collection,
        fields: fields
      },
      success: function (response) {
        options.success();
      },
      error: function (res) {
        options.error(res);
      }
    });
  }

  deleteSchemaField(options) {
    const fields = {};
    fields[options.field] = { __op: 'Delete' };
    this._makeRequest('/schemas/' + options.collection, {
      method: 'PUT',
      content: {
        className: options.collection,
        fields: fields
      },
      success: function (response) {
        options.success();
      },
      error: function (res) {
        options.error(res);
      }
    });
  }

  deleteSchema(options) {
    this._makeRequest('/schemas/' + options.collection, {
      method: 'DELETE',
      success: function (response) {
        options.success();
      },
      error: function (res) {
        options.error(res);
      }
    });
  }

  batchCreateObjects(options) {
    const url = new URL(this.endpoint);

    const _data = {
      requests: options.data.map((o) => ({
        method: 'POST',
        path: url.pathname + '/classes/' + options.collection,
        body: o
      }))
    };

    this._makeRequest('/batch', {
      method: 'POST',
      content: _data,
      success: function (response) {
        options.success();
      },
      error: function (res) {
        options.error(res.error);
      }
    });
  }
}

module.exports = SchemaModel;
