'use strict';

const Base = require('./base');

module.exports = Base.extendSetComponentObjectProperties({
  name: 'net.noodl.SetComponentObjectProperties',
  displayName: 'Set Component Object Properties',
  docs: 'https://docs.noodl.net/nodes/component-utilities/set-component-object-properties',
  getComponentObjectId: function () {
    return 'componentState' + this.nodeScope.componentOwner.getInstanceId();
  }
});
