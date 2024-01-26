const CloudFormation = require('@noodl-utils/cloudformation').default;
const SchemaModel = require('@noodl-models/schemamodel');
const _ = require('lodash');
const { _listenersEnabled } = require('../../src/shared/model');

// Noodl unit tests cloud services
const cs = {
  endpoint: 'https://cs2.noodlapp.com/noodl-dev/w6lw4bfbzp',
  appId: 'noodl-dev-w6lw4bfbzp',
  masterKey: 'yl3QiFnutSUjTR4D'
};

function _makeRequest(path, options) {
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

  xhr.open(options.method || 'GET', cs.endpoint + path, true);

  xhr.setRequestHeader('X-Parse-Application-Id', cs.appId);
  xhr.setRequestHeader('X-Parse-MASTER-Key', cs.masterKey);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.send(JSON.stringify(options.content));
}

function deleteCollection(options) {
  // First delete all objects
  _makeRequest('/classes/' + options.collection, {
    method: 'GET',
    success: (r) => {
      const url = new URL(cs.endpoint);

      const _batchDelete = {
        requests: r.results.map((o) => ({
          method: 'DELETE',
          path: url.pathname + '/classes/' + options.collection + '/' + o.objectId
        }))
      };

      _makeRequest('/batch', {
        method: 'POST',
        content: _batchDelete,
        success: function (response) {
          // Collection empty, delete schema
          _makeRequest('/schemas/' + options.collection, {
            method: 'DELETE',
            success: function (response) {
              options.success();
            },
            error: function (res) {
              console.log(res.error);
              options.error();
            }
          });
        },
        error: (res) => {
          console.log(res.error);
          options.error();
        }
      });
    },
    error: (err) => {
      console.log(err);
      options.error();
    }
  });
}

function _pluck(o, fields) {
  var _o = {};
  fields.forEach((f) => {
    _o[f] = o[f];
  });
  return _o;
}

function verifyObjects(options) {
  _makeRequest('/classes/' + options.collection, {
    method: 'GET',
    success: (r) => {
      if (options.data.length !== r.results.length) options.error();
      else {
        const a = {},
          b = {};
        options.data.forEach((o) => {
          a[o.ref] = _pluck(o, options.fields);
        });
        r.results.forEach((o) => {
          b[o.ref] = _pluck(o, options.fields);
        });

        if (_.isEqual(a, b)) options.success();
        else options.error();
      }
    },
    error: (err) => {
      console.log(res.error);
      options.error();
    }
  });
}

function verifySchema(options) {
  var sm = new SchemaModel(cs);
  sm.getSchema({
    collection: options.name,
    success: function (schema) {
      for (var key in options.fields) {
        if (schema.fields[key] === undefined || schema.fields[key].type !== options.fields[key].type) {
          return options.result(false);
        }
      }

      options.result(true);
    },
    error: function () {
      options.result(false);
    }
  });
}

describe('Cloud formation', function () {
  beforeEach(function (done) {
    deleteCollection({
      collection: 'form_test',
      success: function () {
        done();
      },
      error: function () {
        done();
      }
    });
  });

  xit('can handle create collection', function (done) {
    const cf = new CloudFormation({
      cs: cs
    });

    const formationJson = {
      formation: [
        {
          type: 'collection',
          name: 'form_test',
          properties: {
            a: {
              type: 'Number'
            },
            b: {
              type: 'String'
            }
          }
        }
      ]
    };

    cf._form({
      template: formationJson,
      success: function () {
        verifySchema({
          name: 'form_test',
          fields: {
            a: {
              type: 'Number'
            },
            b: {
              type: 'String'
            }
          },
          result: function (r) {
            expect(r).toBe(true);
            done();
          }
        });
      },
      error: function () {}
    });
  });

  xit('will add property to existing collection', function (done) {
    const cf = new CloudFormation({
      cs: cs
    });

    const formationJson1 = {
      formation: [
        {
          type: 'collection',
          name: 'form_test',
          properties: {
            a: {
              type: 'Number'
            },
            b: {
              type: 'String'
            }
          }
        }
      ]
    };

    const formationJson2 = {
      formation: [
        {
          type: 'collection',
          name: 'form_test',
          properties: {
            c: {
              type: 'Date'
            }
          }
        }
      ]
    };

    cf._form({
      template: formationJson1,
      success: function () {
        cf._form({
          template: formationJson2,
          success: function () {
            verifySchema({
              name: 'form_test',
              fields: {
                a: {
                  type: 'Number'
                },
                b: {
                  type: 'String'
                },
                c: {
                  type: 'Date'
                }
              },
              result: function (r) {
                expect(r).toBe(true);
                done();
              }
            });
          },
          error: function () {
            expect(true).toBe(false); // Fail
            done();
          }
        });
      },
      error: function () {
        expect(true).toBe(false); // Fail
        done();
      }
    });
  });

  xit('will fail with property clash', function (done) {
    const cf = new CloudFormation({
      cs: cs
    });

    const formationJson1 = {
      formation: [
        {
          type: 'collection',
          name: 'form_test',
          properties: {
            a: {
              type: 'Number'
            },
            b: {
              type: 'String'
            }
          }
        }
      ]
    };

    const formationJson2 = {
      formation: [
        {
          type: 'collection',
          name: 'form_test',
          properties: {
            a: {
              type: 'String'
            }
          }
        }
      ]
    };

    cf._form({
      template: formationJson1,
      success: function () {
        cf._form({
          template: formationJson2,
          success: function () {
            expect(true).toBe(false); // Fail
            done();
          },
          error: function (err) {
            expect(err).toBe('Property already exists with different type a for collection form_test');
            done();
          }
        });
      },
      error: function () {
        expect(true).toBe(false); // Fail
        done();
      }
    });
  });

  xit('can create sample data', function (done) {
    const cf = new CloudFormation({
      cs: cs
    });

    const data = [
      {
        b: 20,
        a: '1',
        ref: 'A'
      },
      {
        b: 22,
        a: '2',
        ref: 'B'
      },
      {
        b: 25,
        a: '3',
        ref: 'C'
      }
    ];

    const formationJson = {
      formation: [
        {
          type: 'collection',
          name: 'form_test',
          properties: {
            a: {
              type: 'String'
            },
            b: {
              type: 'Number'
            }
          },
          data: data
        }
      ]
    };

    cf._form({
      template: formationJson,
      success: function () {
        verifyObjects({
          collection: 'form_test',
          data: data,
          fields: ['a', 'b'],
          success: () => {
            expect(true).toBe(true);
            done();
          },
          error: () => {
            expect(true).toBe(false); // Fail
            done();
          }
        });
      },
      error: function (err) {
        expect(true).toBe(false); // Fail
        done();
      }
    });
  });
});
