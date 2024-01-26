'use strict';

var EaseCurves = require('../../easecurves');

var defaultDuration = 300;

var TransitionNode = {
  name: 'Transition',
  docs: 'https://docs.noodl.net/nodes/animation/transition',
  shortDesc: 'This node can interpolate smooothely for the current value to a target value.',
  category: 'Animation',
  deprecated: true,
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
    'overrideCurrentValue.value': {
      type: {
        name: 'number'
      },
      group: 'Override Value',
      displayName: 'Override Value',
      editorName: 'Value|Override Value',
      set: function (value) {
        this._internal.overrideValue = value;
      }
    },
    'overrideCurrentValue.do': {
      group: 'Override Value',
      displayName: 'Do',
      editorName: 'Do|Override Value',
      valueChangedToTrue: function () {
        setCurrentNumber.call(this, this._internal.overrideValue);
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

function setCurrentNumber(value) {
  /* jshint validthis:true */
  var animation = this._internal._animation;

  animation.stop();
  animation.startValue = value;

  //wait until all values are set until checking if animation needs to be started
  this.scheduleAfterInputsHaveUpdated(function () {
    if (animation.endValue !== value) {
      animation.start();
    }
  });
  this._internal.currentNumber = value;
  this.flagOutputDirty('currentValue');
}

module.exports = {
  node: TransitionNode
};
