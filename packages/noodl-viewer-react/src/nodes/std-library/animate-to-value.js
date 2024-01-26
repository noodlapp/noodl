'use strict';

var EaseCurves = require('../../easecurves');

var defaultDuration = 300;

var AnimateToValue = {
  name: 'net.noodl.animatetovalue',
  docs: 'https://docs.noodl.net/nodes/logic/animate-to-value',
  displayName: 'Animate To Value',
  shortDesc: 'This node can interpolate smooothely from the current value to a target value.',
  category: 'Animation',
  initialize: function () {
    var self = this,
      _internal = this._internal;

    _internal.currentNumber = 0;
    _internal.numberInitialized = false;
    _internal.animationStarted = false;
    _internal.setCurrentNumberEnabled = false;
    _internal.overrideValue = 0;

    _internal._animation = this.context.timerScheduler.createTimer({
      duration: defaultDuration,
      startValue: 0,
      endValue: 0,
      ease: EaseCurves.easeOut,
      onStart: function () {
        _internal.animationStarted = true;
      },
      onRunning: function (t) {
        _internal.currentNumber = this.ease(this.startValue, this.endValue, t);
        self.flagOutputDirty('currentValue');
      },
      onFinish: function () {
        self.sendSignalOnOutput('atTargetValue');
      }
    });
  },
  getInspectInfo() {
    return this._internal.currentNumber;
  },
  inputs: {
    targetValue: {
      type: {
        name: 'number'
      },
      displayName: 'Target Value',
      group: 'Target Value',
      default: undefined, //default is undefined so transition initializes to the first input value
      set: function (value) {
        if (value === true) {
          value = 1;
        } else if (value === false) {
          value = 0;
        }

        value = Number(value);

        if (isNaN(value)) {
          //bail out on NaN values
          return;
        }

        var internal = this._internal;

        if (internal.numberInitialized === false) {
          internal.currentNumber = value;
          internal.numberInitialized = true;
          internal._animation.endValue = value;
          this.flagOutputDirty('currentValue');
          return;
        } else if (value === internal._animation.endValue) {
          //same as previous value
          return;
        }

        internal._animation.startValue = internal.currentNumber;
        internal._animation.endValue = value;
        internal._animation.start();
      }
    },
    duration: {
      type: 'number',
      group: 'Parameters',
      displayName: 'Duration',
      default: defaultDuration,
      set: function (value) {
        this._internal._animation.duration = value;
      }
    },
    delay: {
      type: 'number',
      group: 'Parameters',
      displayName: 'Delay',
      default: 0,
      set: function (value) {
        this._internal._animation.delay = value;
      }
    },
    easingCurve: {
      type: {
        name: 'enum',
        enums: [
          { value: 'easeOut', label: 'Ease Out' },
          { value: 'easeIn', label: 'Ease In' },
          { value: 'linear', label: 'Linear' },
          { value: 'easeInOut', label: 'Ease In Out' }
        ]
      },
      default: 'easeOut',
      displayName: 'Easing Curve',
      group: 'Parameters',
      set: function (value) {
        this._internal._animation.ease = EaseCurves[value];
      }
    }
  },
  outputs: {
    currentValue: {
      type: 'number',
      displayName: 'Current Value',
      group: 'Current State',
      getter: function () {
        return this._internal.currentNumber;
      }
    },
    atTargetValue: {
      type: 'signal',
      displayName: 'At Target Value',
      group: 'Signals'
    }
  }
};

module.exports = {
  node: AnimateToValue
};
