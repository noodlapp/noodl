'use strict';

const DeviceNode = {
  name: 'Humidity Sensor',
  docs: 'https://www.neue.se/support-documentation/building-an-app/patches-the-building-blocks/',
  category: 'Neue',
  color: 'neue',
  initialize: function () {
    this._internal.inputs = [];
  },
  getInspectInfo() {
    return and(this._internal.inputs);
  },
  inputs: {
    active: {
      type: 'boolean',
      displayName: 'On/Off',
      get() {
        return this._internal.active;
      }
    },
    readrate: {
      type: 'number',
      displayName: 'Read Rate',
      get() {
        return this._internal.readrate;
      }
    }
  },
  outputs: {
    activity: {
      type: 'signal',
      displayName: 'Activity changed',
      get() {
        return this._internal.result;
      }
    },
    value: {
      type: 'number',
      displayName: 'Read value',
      get() {
        return this._internal.result;
      }
    }
  }
};

module.exports = {
  node: DeviceNode
};

function and(values) {
  //if none are false, then return true
  return values.length > 0 && values.some((v) => !v) === false;
}
