'use strict';

const GyroscopeNode = {
  name: 'Gyroscope',
  docs: 'https://docs.noodl.net/nodes/sensors/device-orientation',
  shortDesc: 'The orientation of a device. Works on phones, tablets and other devices with the required sensors.',
  displayNodeName: 'Device Orientation',
  category: 'Sensors',
  deprecated: true,
  initialize: function () {
    this._internal.alpha = 0;
    this._internal.beta = 0;
    this._internal.gamma = 0;

    var onEvent = onDeviceOrientation.bind(this);
    window.addEventListener('deviceorientation', onEvent);
    this.context.eventEmitter.once('applicationDataReloaded', function () {
      window.removeEventListener('deviceorientation', onEvent);
    });
  },
  outputs: {
    rotationX: {
      type: 'number',
      displayName: 'Rotation X',
      getter: function () {
        return -this._internal.beta;
      }
    },
    rotationY: {
      type: 'number',
      displayName: 'Rotation Y',
      getter: function () {
        return this._internal.gamma;
      }
    },
    rotationZ: {
      type: 'number',
      displayName: 'Rotation Z',
      getter: function () {
        return -this._internal.alpha;
      }
    }
  }
};

function onDeviceOrientation(event) {
  /* jshint validthis:true */
  if (event.alpha !== this._internal.alpha) {
    this._internal.alpha = event.alpha;
    this.flagOutputDirty('rotationZ');
  }
  if (event.beta !== this._internal.beta) {
    this._internal.beta = event.beta;
    this.flagOutputDirty('rotationX');
  }
  if (event.gamma !== this._internal.gamma) {
    this._internal.gamma = event.gamma;
    this.flagOutputDirty('rotationY');
  }
}

module.exports = {
  node: GyroscopeNode
};
