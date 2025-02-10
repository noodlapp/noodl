const CloudStore = require('./cloudstore');
const Model = require('../model');

function convertVisualFilter(query, options) {
  var inputs = options.queryParameters;

  if (query.combinator !== undefined && query.rules !== undefined) {
    if (query.rules.length === 0) return;
    else if (query.rules.length === 1) return convertVisualFilter(query.rules[0], options);
    else {
      const _res = {};
      const _op = '$' + query.combinator;
      _res[_op] = [];
      query.rules.forEach((r) => {
        var cond = convertVisualFilter(r, options);
        if (cond !== undefined) _res[_op].push(cond);
      });

      return _res;
    }
  } else if (query.operator === 'related to') {
    var value = query.input !== undefined ? inputs[query.input] : undefined;
    if (value === undefined) return;

    return {
      $relatedTo: {
        object: {
          __type: 'Pointer',
          objectId: value,
          className: query.relatedTo
        },
        key: query.relationProperty
      }
    };
  } else {
    const _res = {};
    var cond;
    var value = query.input !== undefined ? inputs[query.input] : query.value;

    if (query.operator === 'exist') {
      _res[query.property] = { $exists: true };
      return _res;
    } else if (query.operator === 'not exist') {
      _res[query.property] = { $exists: false };
      return _res;
    }

    if (value === undefined) return;

    if (CloudStore._collections[options.collectionName])
      var schema = CloudStore._collections[options.collectionName].schema;

    var propertyType =
      schema && schema.properties && schema.properties[query.property]
        ? schema.properties[query.property].type
        : undefined;

    if (propertyType === 'Date') {
      if (!(value instanceof Date)) value = new Date(value.toString());
      value = { __type: 'Date', iso: value.toISOString() };
    }

    if (query.operator === 'greater than') cond = { $gt: value };
    else if (query.operator === 'greater than or equal to') cond = { $gte: value };
    else if (query.operator === 'less than') cond = { $lt: value };
    else if (query.operator === 'less than or equal to') cond = { $lte: value };
    else if (query.operator === 'equal to') cond = { $eq: value };
    else if (query.operator === 'not equal to') cond = { $ne: value };
    else if (query.operator === 'points to') {
      var targetClass =
        schema && schema.properties && schema.properties[query.property]
          ? schema.properties[query.property].targetClass
          : undefined;

      cond = {
        $eq: { __type: 'Pointer', objectId: value, className: targetClass }
      };
    } else if (query.operator === 'contain') {
      cond = { $regex: value, $options: 'i' };
    }

    _res[query.property] = cond;

    return _res;
  }
}

function matchesQuery(model, query) {
  var match = true;

  if (query === undefined) return true;

  if (query['$and'] !== undefined) {
    query['$and'].forEach((q) => {
      match &= matchesQuery(model, q);
    });
  } else if (query['$or'] !== undefined) {
    match = false;
    query['$or'].forEach((q) => {
      match |= matchesQuery(model, q);
    });
  } else {
    var keys = Object.keys(query);
    keys.forEach((k) => {
      if (k === 'objectId') {
        if (query[k]['$eq'] !== undefined) match &= model.getId() === query[k]['$eq'];
        else if (query[k]['$in'] !== undefined) match &= query[k]['$in'].indexOf(model.getId()) !== -1;
      } else if (k === '$relatedTo') {
        match = false; // cannot resolve relation queries locally
      } else {
        var value = model.get(k);
        if (query[k]['$eq'] !== undefined && query[k]['$eq'].__type === 'Pointer')
          match &= value === query[k]['$eq'].objectId;
        else if (query[k]['$eq'] !== undefined) match &= value == query[k]['$eq'];
        else if (query[k]['$ne'] !== undefined) match &= value != query[k]['$ne'];
        else if (query[k]['$lt'] !== undefined) match &= value < query[k]['$lt'];
        else if (query[k]['$lte'] !== undefined) match &= value <= query[k]['$lt'];
        else if (query[k]['$gt'] !== undefined) match &= value > query[k]['$gt'];
        else if (query[k]['$gte'] !== undefined) match &= value >= query[k]['$gte'];
        else if (query[k]['$exists'] !== undefined) match &= value !== undefined;
        else if (query[k]['$in'] !== undefined) match &= query[k]['$in'].indexOf(value) !== -1;
        else if (query[k]['$nin'] !== undefined) match &= query[k]['$in'].indexOf(value) === -1;
        else if (query[k]['$regex'] !== undefined)
          match &= new RegExp(query[k]['$regex'], query[k]['$options']).test(value);
      }
    });
  }
  return match;
}

function compareObjects(sort, a, b) {
  for (var i = 0; i < sort.length; i++) {
    let _s = sort[i];
    if (_s[0] === '-') {
      // Descending
      let prop = _s.substring(1);
      if (a.get(prop) > b.get(prop)) return -1;
      else if (a.get(prop) < b.get(prop)) return 1;
    } else {
      // Ascending
      if (a.get(_s) > b.get(_s)) return 1;
      else if (a.get(_s) < b.get(_s)) return -1;
    }
  }
  return 0;
}

function convertVisualSorting(sorting) {
  return sorting.map((s) => {
    return (s.order === 'descending' ? '-' : '') + s.property;
  });
}

function _value(v) {
  if (v instanceof Date && typeof v.toISOString === 'function') {
    return {
      __type: 'Date',
      iso: v.toISOString()
    };
  }
  return v;
}

/**
 *
 * @param {Record<string, unknown>} filter
 * @param {{
 *   collectionName?: string;
 *   modelScope?: unknown;
 *   error: (error: string) => void;
 * }} options
 * @returns
 */
function convertFilterOp(filter, options) {
  const keys = Object.keys(filter);
  if (keys.length === 0) return {};
  if (keys.length !== 1) {
    return options.error('Filter must only have one key found ' + keys.join(','));
  }

  const res = {};
  const key = keys[0];
  if (filter['and'] !== undefined && Array.isArray(filter['and'])) {
    res['$and'] = filter['and'].map((f) => convertFilterOp(f, options));
  } else if (filter['or'] !== undefined && Array.isArray(filter['or'])) {
    res['$or'] = filter['or'].map((f) => convertFilterOp(f, options));
  } else if (filter['idEqualTo'] !== undefined) {
    res['objectId'] = { $eq: filter['idEqualTo'] };
  } else if (filter['idContainedIn'] !== undefined) {
    res['objectId'] = { $in: filter['idContainedIn'] };
  } else if (filter['relatedTo'] !== undefined) {
    const modelId = filter['relatedTo']['id'];
    if (modelId === undefined) {
      return options.error('Must provide id in relatedTo filter');
    }

    const relationKey = filter['relatedTo']['key'];
    if (relationKey === undefined) {
      return options.error('Must provide key in relatedTo filter');
    }

    const className = filter['relatedTo']['className'] || (options.modelScope || Model).get(modelId)?._class;
    if (typeof className === 'undefined') {
      // Either the pointer is loaded as an object or we allow passing in the className.
      return options.error('Must preload the Pointer or include className');
    }

    res['$relatedTo'] = {
      object: {
        __type: 'Pointer',
        objectId: modelId,
        className
      },
      key: relationKey
    };
  } else if (typeof filter[key] === 'object') {
    const opAndValue = filter[key];
    if (opAndValue['equalTo'] !== undefined) res[key] = { $eq: _value(opAndValue['equalTo']) };
    else if (opAndValue['notEqualTo'] !== undefined) res[key] = { $ne: _value(opAndValue['notEqualTo']) };
    else if (opAndValue['lessThan'] !== undefined) res[key] = { $lt: _value(opAndValue['lessThan']) };
    else if (opAndValue['greaterThan'] !== undefined) res[key] = { $gt: _value(opAndValue['greaterThan']) };
    else if (opAndValue['lessThanOrEqualTo'] !== undefined)
      res[key] = { $lte: _value(opAndValue['lessThanOrEqualTo']) };
    else if (opAndValue['greaterThanOrEqualTo'] !== undefined)
      res[key] = { $gte: _value(opAndValue['greaterThanOrEqualTo']) };
    else if (opAndValue['exists'] !== undefined) res[key] = { $exists: opAndValue['exists'] };
    else if (opAndValue['containedIn'] !== undefined) res[key] = { $in: opAndValue['containedIn'] };
    else if (opAndValue['notContainedIn'] !== undefined) res[key] = { $nin: opAndValue['notContainedIn'] };
    else if (opAndValue['pointsTo'] !== undefined) {
      let schema = null;
      if (CloudStore._collections[options.collectionName]) {
        schema = CloudStore._collections[options.collectionName].schema;
      }

      const targetClass =
        schema && schema.properties && schema.properties[key] ? schema.properties[key].targetClass : undefined;
      const type = schema && schema.properties && schema.properties[key] ? schema.properties[key].type : undefined;

      if (type === 'Relation') {
        res[key] = {
          __type: 'Pointer',
          objectId: opAndValue['pointsTo'],
          className: targetClass
        };
      } else {
        if (Array.isArray(opAndValue['pointsTo'])) {
          res[key] = {
            $in: opAndValue['pointsTo'].map((v) => {
              return { __type: 'Pointer', objectId: v, className: targetClass };
            })
          };
        } else {
          res[key] = {
            $eq: {
              __type: 'Pointer',
              objectId: opAndValue['pointsTo'],
              className: targetClass
            }
          };
        }
      }
    } else if (opAndValue['matchesRegex'] !== undefined) {
      res[key] = {
        $regex: opAndValue['matchesRegex'],
        $options: opAndValue['options']
      };
    } else if (opAndValue['text'] !== undefined && opAndValue['text']['search'] !== undefined) {
      var _v = opAndValue['text']['search'];
      if (typeof _v === 'string') res[key] = { $text: { $search: { $term: _v, $caseSensitive: false } } };
      else
        res[key] = {
          $text: {
            $search: {
              $term: _v.term,
              $language: _v.language,
              $caseSensitive: _v.caseSensitive,
              $diacriticSensitive: _v.diacriticSensitive
            }
          }
        };
      // Geo points
    } else if (opAndValue['nearSphere'] !== undefined) {
      var _v = opAndValue['nearSphere'];
      res[key] = {
        $nearSphere: {
          __type: 'GeoPoint',
          latitude: _v.latitude,
          longitude: _v.longitude
        },
        $maxDistanceInMiles: _v.$maxDistanceInMiles,
        $maxDistanceInKilometers: _v.maxDistanceInKilometers,
        $maxDistanceInRadians: _v.maxDistanceInRadians
      };
    } else if (opAndValue['withinBox'] !== undefined) {
      var _v = opAndValue['withinBox'];
      res[key] = {
        $within: {
          $box: _v.map((gp) => ({
            __type: 'GeoPoint',
            latitude: gp.latitude,
            longitude: gp.longitude
          }))
        }
      };
    } else if (opAndValue['withinPolygon'] !== undefined) {
      var _v = opAndValue['withinPolygon'];
      res[key] = {
        $geoWithin: {
          $polygon: _v.map((gp) => ({
            __type: 'GeoPoint',
            latitude: gp.latitude,
            longitude: gp.longitude
          }))
        }
      };
    }
  } else {
    options.error('Unrecognized filter keys ' + keys.join(','));
  }

  return res;
}

module.exports = {
  convertVisualFilter,
  compareObjects,
  matchesQuery,
  convertVisualSorting,
  convertFilterOp
};
