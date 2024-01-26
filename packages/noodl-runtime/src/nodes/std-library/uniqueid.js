'use strict';

const Model = require('../../model');

const UniqueIdNode = {
  name: 'Unique Id',
  docs: 'https://docs.noodl.net/nodes/utilities/unique-id',
  category: 'String Manipulation',
  initialize: function () {
    var internal = this._internal;
    internal.guid = Model.guid();
  },
  getInspectInfo() {
    return this._internal.guid;
  },
  inputs: {
    new: {
      displayName: 'New',
      valueChangedToTrue: function () {
        var internal = this._internal;
        internal.guid = Model.guid();
        this.flagOutputDirty('guid');
      }
    }
  },
  outputs: {
    guid: {
      type: 'string',
      displayName: 'Id',
      getter: function () {
        var internal = this._internal;
        return internal.guid;
      }
    }
  },
  prototypeExtensions: {}
};

module.exports = {
  node: UniqueIdNode
};
