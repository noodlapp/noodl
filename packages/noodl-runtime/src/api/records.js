const CloudStore = require('./cloudstore');
const QueryUtils = require('./queryutils');
const Model = require('../model');

function createRecordsAPI(modelScope) {
  let _cloudstore;
  const cloudstore = () => {
    // We must create the cloud store just in time so all meta data is loaded
    if (!_cloudstore) _cloudstore = new CloudStore(modelScope);
    return _cloudstore;
  };

  return {
    async query(className, query, options) {
      if (typeof className === 'undefined') throw new Error("'className' is undefined");
      return new Promise((resolve, reject) => {
        cloudstore().query({
          collection: className,
          where: QueryUtils.convertFilterOp(query || {}, {
            collectionName: className,
            error: (e) => reject(e),
            modelScope
          }),
          limit: options ? options.limit : undefined,
          sort: options ? options.sort : undefined,
          skip: options ? options.skip : undefined,
          include: options ? options.include : undefined,
          select: options ? options.select : undefined,
          count: options ? options.count : undefined,
          success: (results, count) => {
            const _results = results.map((r) => cloudstore()._fromJSON(r, className));
            if (count !== undefined) resolve({ results: _results, count });
            else resolve(_results);
          },
          error: (err) => {
            reject(Error(err || 'Failed to query.'));
          }
        });
      });
    },

    async count(className, query) {
      if (typeof className === 'undefined') throw new Error("'className' is undefined");
      return new Promise((resolve, reject) => {
        cloudstore().count({
          collection: className,
          where: query
            ? QueryUtils.convertFilterOp(query || {}, {
                collectionName: className,
                error: (e) => reject(e),
                modelScope
              })
            : undefined,
          success: (count) => {
            resolve(count);
          },
          error: (err) => {
            reject(Error(err || 'Failed to query.'));
          }
        });
      });
    },

    async distinct(className, property, query) {
      if (typeof className === 'undefined') throw new Error("'className' is undefined");
      return new Promise((resolve, reject) => {
        cloudstore().distinct({
          collection: className,
          property,
          where: query
            ? QueryUtils.convertFilterOp(query || {}, {
                collectionName: className,
                error: (e) => reject(e),
                modelScope
              })
            : undefined,
          success: (results) => {
            resolve(results);
          },
          error: (err) => {
            reject(Error(err || 'Failed to query.'));
          }
        });
      });
    },

    async aggregate(className, group, query) {
      if (typeof className === 'undefined') throw new Error("'className' is undefined");
      return new Promise((resolve, reject) => {
        cloudstore().aggregate({
          collection: className,
          group,
          where: query
            ? QueryUtils.convertFilterOp(query || {}, {
                collectionName: className,
                error: (e) => reject(e),
                modelScope
              })
            : undefined,
          success: (results) => {
            resolve(results);
          },
          error: (err) => {
            reject(Error(err || 'Failed to aggregate.'));
          }
        });
      });
    },

    /**
     *
     * @param {string | { getId(): string; }} objectOrId
     * @param {{
     *    className: string;
     *    keys?: string[] | string;
     *    include?: string[] | string;
     *    excludeKeys?: string[] | string;
     * }} options
     * @returns {Promise<unknown>}
     */
    async fetch(objectOrId, options) {
      if (typeof objectOrId === 'undefined') return Promise.reject(new Error("'objectOrId' is undefined."));
      if (typeof objectOrId !== 'string') objectOrId = objectOrId.getId();
      const className = (options ? options.className : undefined) || (modelScope || Model).get(objectOrId)._class;

      return new Promise((resolve, reject) => {
        if (!className) {
          return reject('No class name specified');
        }

        cloudstore().fetch({
          collection: className,
          objectId: objectOrId,
          keys: options?.keys,
          include: options?.include,
          excludeKeys: options?.excludeKeys,
          success: function (response) {
            const record = cloudstore()._fromJSON(response, className);
            resolve(record);
          },
          error: function (err) {
            reject(Error(err || 'Failed to fetch.'));
          }
        });
      });
    },

    async increment(objectOrId, properties, options) {
      if (typeof objectOrId === 'undefined') return Promise.reject(new Error("'objectOrId' is undefined."));
      if (typeof objectOrId !== 'string') objectOrId = objectOrId.getId();
      const className = (options ? options.className : undefined) || (modelScope || Model).get(objectOrId)._class;

      return new Promise((resolve, reject) => {
        if (!className) return reject('No class name specified');

        cloudstore().increment({
          collection: className,
          objectId: objectOrId,
          properties,
          success: (response) => {
            cloudstore()._fromJSON(Object.assign({ objectId: objectOrId }, response), className); // Update values

            resolve();
          },
          error: (err) => {
            reject(Error(err || 'Failed to increment.'));
          }
        });
      });
    },

    async save(objectOrId, properties, options) {
      if (typeof objectOrId === 'undefined') return Promise.reject(new Error("'objectOrId' is undefined."));
      if (typeof objectOrId !== 'string') objectOrId = objectOrId.getId();
      const className = (options ? options.className : undefined) || (modelScope || Model).get(objectOrId)._class;

      const model = (modelScope || Model).get(objectOrId);
      if (properties) {
        Object.keys(properties).forEach((p) => {
          model.set(p, properties[p]);
        });
      }

      return new Promise((resolve, reject) => {
        if (!className) return reject('No class name specified');

        cloudstore().save({
          collection: className,
          objectId: objectOrId,
          data: properties || model.data,
          acl: options ? options.acl : undefined,
          success: (response) => {
            cloudstore()._fromJSON(Object.assign({ objectId: objectOrId }, response), className); // Assign updated at
            resolve();
          },
          error: (err) => {
            reject(Error(err || 'Failed to save.'));
          }
        });
      });
    },

    async create(className, properties, options) {
      if (typeof className === 'undefined') throw new Error("'className' is undefined");
      return new Promise((resolve, reject) => {
        cloudstore().create({
          collection: className,
          data: properties,
          acl: options ? options.acl : undefined,
          success: (data) => {
            // Successfully created
            const m = cloudstore()._fromJSON(data, className);
            resolve(m);
          },
          error: (err) => {
            reject(Error(err || 'Failed to insert.'));
          }
        });
      });
    },

    async delete(objectOrId, options) {
      if (typeof objectOrId === 'undefined') return Promise.reject(new Error("'objectOrId' is undefined."));
      if (typeof objectOrId !== 'string') objectOrId = objectOrId.getId();
      const className = (options ? options.className : undefined) || (modelScope || Model).get(objectOrId)._class;

      return new Promise((resolve, reject) => {
        if (!className) return reject('No class name specified');

        cloudstore().delete({
          collection: className,
          objectId: objectOrId,
          success: () => {
            (modelScope || Model).get(objectOrId).notify('delete');
            resolve();
          },
          error: (err) => {
            reject(Error(err || 'Failed to delete.'));
          }
        });
      });
    },

    async addRelation(options) {
      const recordId = options.recordId || options.record.getId();
      const className = options.className || (modelScope || Model).get(recordId)._class;

      const targetRecordId = options.targetRecordId || options.targetRecord.getId();
      const targetClassName = options.targetClassName || (modelScope || Model).get(targetRecordId)._class;

      return new Promise((resolve, reject) => {
        if (!className) return reject('No class name specified');
        if (!targetClassName) return reject('No target class name specified');

        cloudstore().addRelation({
          collection: className,
          objectId: recordId,
          key: options.key,
          targetObjectId: targetRecordId,
          targetClass: targetClassName,
          success: (response) => {
            resolve();
          },
          error: (err) => {
            reject(Error(err || 'Failed to add relation.'));
          }
        });
      });
    },

    async removeRelation(options) {
      const recordId = options.recordId || options.record.getId();
      const className = options.className || (modelScope || Model).get(recordId)._class;

      const targetRecordId = options.targetRecordId || options.targetRecord.getId();
      const targetClassName = options.targetClassName || (modelScope || Model).get(targetRecordId)._class;

      return new Promise((resolve, reject) => {
        if (!className) return reject('No class name specified');
        if (!targetClassName) return reject('No target class name specified');

        cloudstore().removeRelation({
          collection: className,
          objectId: recordId,
          key: options.key,
          targetObjectId: targetRecordId,
          targetClass: targetClassName,
          success: (response) => {
            resolve();
          },
          error: (err) => {
            reject(Error(err || 'Failed to add relation.'));
          }
        });
      });
    }
  };
}

module.exports = createRecordsAPI;
