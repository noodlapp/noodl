'use strict';

const EaseCurves = require('../../easecurves'),
  BezierEasing = require('bezier-easing');

function SubAnimation(args) {
  this.name = args.name;
  this.startValue = 0;
  this.endValue = 0;
  this.currentValue = undefined;
  this.startMode = 'implicit';
  this.ease = args.ease;
  this.node = args.node;
  this.hasSampledStartValue = false;

  var self = this;

  this.animation = args.node.context.timerScheduler.createTimer({
    startValue: 0,
    endValue: 0,
    onRunning: function (t) {
      var value = self.ease(this.startValue, this.endValue, t);
      self.setCurrentValue(value);
    }
  });
  this.animation.startValue = 0;
  this.animation.endValue = 0;
}

Object.defineProperties(SubAnimation.prototype, {
  setCurrentValue: {
    value: function (value) {
      this.currentValue = value;
      this.node.flagOutputDirty(this.name);
    }
  },
  play: {
    value: function (start, end) {
      if (start === undefined) {
        console.log('Animation warning, start value is undefined');
        start = 0;
      }
      if (end === undefined) {
        console.error('Animation error, start:', start, 'end:', end);
        return;
      }
      var animation = this.animation;
      animation.startValue = start;
      this.setCurrentValue(start);
      animation.endValue = end;
      animation.duration = this.node._internal.duration;
      animation.start();
    }
  },
  playToEnd: {
    value: function () {
      if (this.hasConnections() === false) {
        return;
      }
      this.updateStartValue();
      this.play(this.getTargetsCurrentValue(), this.endValue);
    }
  },
  playToStart: {
    value: function () {
      if (this.hasConnections() === false) {
        return;
      }
      this.updateStartValue();
      this.play(this.getTargetsCurrentValue(), this.startValue);
    }
  },
  replayToEnd: {
    value: function () {
      if (this.hasConnections() === false) {
        return;
      }
      this.updateStartValue(); //in case animation doesn't have an explicit start value set
      this.play(this.startValue, this.endValue);
    }
  },
  replayToStart: {
    value: function () {
      if (this.hasConnections() === false) {
        return;
      }
      this.play(this.endValue, this.startValue);
    }
  },
  hasConnections: {
    value: function () {
      return this.node.getOutput(this.name).hasConnections();
    }
  },
  getTargetsCurrentValue: {
    value: function () {
      var valueConnections = this.node.getOutput(this.name).connections;

      //TODO: this will only work for the first connection
      const value = valueConnections[0].node.getInputValue(valueConnections[0].inputPortName);
      return value instanceof Object && value.hasOwnProperty('value') ? value.value : value;
    }
  },
  updateStartValue: {
    value: function () {
      if (this.startMode !== 'implicit' || this.hasSampledStartValue) {
        return;
      }

      this.hasSampledStartValue = true;
      this.startValue = this.getTargetsCurrentValue();
    }
  },
  stop: {
    value: function () {
      this.animation.stop();
      this.setCurrentValue(undefined);
    }
  },
  jumpToStart: {
    value: function () {
      this.animation.stop();
      this.setCurrentValue(this.startValue);
    }
  },
  jumpToEnd: {
    value: function () {
      this.animation.stop();
      this.setCurrentValue(this.endValue);
    }
  }
});

var easeEnum = [
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'linear', label: 'Linear' },
  { value: 'easeInOut', label: 'Ease In Out' },
  { value: 'cubicBezier', label: 'Cubic Bezier' }
];

var defaultDuration = 300;

var AnimationNode = {
  name: 'Animation',
  docs: 'https://docs.noodl.net/nodes/animation/animation',
  shortDesc: 'Node that can animate any number of values, with different types of easing curves.',
  category: 'Animation',
  deprecated: true,
  initialize: function () {
    var internal = this._internal;

    internal.duration = defaultDuration;
    internal.ease = EaseCurves.easeOut;
    internal._isPlayingToEnd = false;
    internal.animations = [];
    internal.cubicBezierPoints = [0, 0, 0, 0];
    internal.cubicBezierFunction = undefined;

    var self = this;

    internal.animation = this.context.timerScheduler.createTimer({
      onFinish: function () {
        if (internal._isPlayingToEnd === false) {
          self.sendSignalOnOutput('hasReachedStart');
        } else {
          self.sendSignalOnOutput('hasReachedEnd');
        }
      }
    });
  },
  inputs: {
    duration: {
      index: 0,
      type: 'number',
      displayName: 'Duration (ms)',
      group: 'Animation Properties',
      default: defaultDuration,
      set: function (value) {
        this._internal.duration = value;
      }
    },
    easingCurve: {
      index: 10,
      type: {
        name: 'enum',
        enums: easeEnum
      },
      group: 'Animation Properties',
      displayName: 'Easing Curve',
      default: 'easeOut',
      set: function (value) {
        var easeCurve;
        if (value === 'cubicBezier') {
          this.updateCubicBezierFunction();
          easeCurve = this._internal.cubicBezierFunction;
        } else {
          easeCurve = EaseCurves[value];
        }

        this._internal.ease = easeCurve;
      }
    },
    playToEnd: {
      index: 20,
      group: 'Play',
      displayName: 'To End',
      editorName: 'Play To End',
      valueChangedToTrue: function () {
        this._internal._isPlayingToEnd = true;

        var animation = this._internal.animation,
          animations = this._internal.animations,
          self = this;

        this.scheduleAfterInputsHaveUpdated(function () {
          animation.duration = self._internal.duration;
          animation.start();
          for (var i = 0; i < animations.length; i++) {
            animations[i].ease = self._internal.ease;
            animations[i].playToEnd();
          }
        });
      }
    },
    playToStart: {
      index: 21,
      group: 'Play',
      displayName: 'To Start',
      editorName: 'Play To Start',
      valueChangedToTrue: function () {
        this._internal._isPlayingToEnd = false;
        var animation = this._internal.animation,
          animations = this._internal.animations,
          self = this;

        this.scheduleAfterInputsHaveUpdated(function () {
          animation.duration = self._internal.duration;
          animation.start();
          for (var i = 0; i < animations.length; i++) {
            animations[i].ease = self._internal.ease;
            animations[i].playToStart();
          }
        });
      }
    },
    replayToEnd: {
      index: 22,
      group: 'Play',
      displayName: 'From Start To End',
      editorName: 'Play From Start To End',
      valueChangedToTrue: function () {
        var animation = this._internal.animation,
          animations = this._internal.animations,
          self = this;

        this._internal._isPlayingToEnd = true;
        this.scheduleAfterInputsHaveUpdated(function () {
          animation.duration = self._internal.duration;
          animation.start();
          for (var i = 0; i < animations.length; i++) {
            animations[i].ease = self._internal.ease;
            animations[i].replayToEnd();
          }
        });
      }
    },
    replayToStart: {
      index: 23,
      group: 'Play',
      displayName: 'From End To Start',
      editorName: 'Play From End To Start',
      valueChangedToTrue: function () {
        this._internal._isPlayingToEnd = false;
        var animation = this._internal.animation,
          animations = this._internal.animations,
          self = this;

        this.scheduleAfterInputsHaveUpdated(function () {
          animation.duration = self._internal.duration;
          animation.start();
          for (var i = 0; i < animations.length; i++) {
            animations[i].ease = self._internal.ease;
            animations[i].replayToStart();
          }
        });
      }
    },
    stop: {
      index: 60,
      group: 'Instant Actions',
      displayName: 'Stop',
      valueChangedToTrue: function () {
        var animation = this._internal.animation,
          animations = this._internal.animations;

        animation.stop();
        for (var i = 0; i < animations.length; i++) {
          animations[i].stop();
        }
      }
    },
    jumpToStart: {
      index: 61,
      group: 'Instant Actions',
      displayName: 'Jump To Start',
      valueChangedToTrue: function () {
        var animations = this._internal.animations;

        for (var i = 0; i < animations.length; i++) {
          animations[i].jumpToStart();
        }

        this.sendSignalOnOutput('hasReachedStart');
      }
    },
    jumpToEnd: {
      index: 62,
      group: 'Instant Actions',
      displayName: 'Jump To End',
      valueChangedToTrue: function () {
        var animations = this._internal.animations;

        for (var i = 0; i < animations.length; i++) {
          animations[i].jumpToEnd();
        }

        this.sendSignalOnOutput('hasReachedEnd');
      }
    },
    cubicBezierP1X: {
      displayName: 'P1 X',
      group: 'Cubic Bezier',
      type: {
        name: 'number'
      },
      index: 11,
      set: function (value) {
        this._internal.cubicBezierPoints[0] = Math.min(1, Math.max(0, value));
        this.updateCubicBezierFunction();
      }
    },
    cubicBezierP1Y: {
      displayName: 'P1 Y',
      group: 'Cubic Bezier',
      type: {
        name: 'number'
      },
      index: 12,
      set: function (value) {
        this._internal.cubicBezierPoints[1] = value;
        this.updateCubicBezierFunction();
      }
    },
    cubicBezierP2X: {
      displayName: 'P2 X',
      group: 'Cubic Bezier',
      type: {
        name: 'number'
      },
      index: 13,
      set: function (value) {
        this._internal.cubicBezierPoints[2] = Math.min(1, Math.max(0, value));
        this.updateCubicBezierFunction();
      }
    },
    cubicBezierP2Y: {
      displayName: 'P2 Y',
      group: 'Cubic Bezier',
      type: {
        name: 'number'
      },
      index: 14,
      set: function (value) {
        this._internal.cubicBezierPoints[3] = value;
        this.updateCubicBezierFunction();
      }
    }
  },
  outputs: {
    hasReachedStart: {
      type: 'signal',
      group: 'Signals',
      displayName: 'Has Reached Start'
    },
    hasReachedEnd: {
      type: 'signal',
      group: 'Signals',
      displayName: 'Has Reached End'
    }
  },
  dynamicports: [
    {
      condition: 'easingCurve = cubicBezier',
      inputs: ['cubicBezierP1X', 'cubicBezierP1Y', 'cubicBezierP2X', 'cubicBezierP2Y']
    },
    //animation outputs
    {
      name: 'expand/basic',
      indexStep: 100,
      template: [
        {
          name: '{{portname}}.startMode',
          type: {
            name: 'enum',
            enums: [
              {
                value: 'explicit',
                label: 'Explicit'
              },
              {
                value: 'implicit',
                label: 'Implicit'
              }
            ],
            allowEditOnly: true
          },
          plug: 'input',
          group: '{{portname}} Animation',
          displayName: 'Start Mode',
          default: 'implicit',
          index: 1000
        },
        {
          name: '{{portname}}.endValue',
          type: 'number',
          plug: 'input',
          group: '{{portname}} Animation',
          displayName: 'End Value',
          editorName: 'End Value | {{portname}} ',
          default: 0,
          index: 1002
        }
      ]
    },
    {
      name: 'expand/basic',
      condition: "'{{portname}}.startMode' = explicit",
      indexStep: 100,
      template: [
        {
          name: '{{portname}}.startValue',
          plug: 'input',
          type: 'number',
          displayName: 'Start Value',
          editorName: 'Start Value | {{portname}}',
          group: '{{portname}} Animation',
          default: 0,
          index: 1001
        }
      ]
    }
  ],
  panels: [
    {
      name: 'PortEditor',
      title: 'Animations',
      plug: 'output',
      type: { name: 'number' },
      group: 'Animation Values'
    }
  ],
  prototypeExtensions: {
    updateCubicBezierFunction: {
      value: function () {
        var points = this._internal.cubicBezierPoints;
        var cubicBezierEase = BezierEasing(points);
        this._internal.cubicBezierFunction = function (start, end, t) {
          return EaseCurves.linear(start, end, cubicBezierEase.get(t));
        };
        this._internal.ease = this._internal.cubicBezierFunction;
      }
    },
    _registerAnimationGroup: {
      value: function (name) {
        var subAnimation = new SubAnimation({
          node: this,
          ease: this._internal.ease,
          name: name
        });

        this._internal.animations.push(subAnimation);

        var inputs = {};

        inputs[name + '.' + 'startMode'] = {
          set: function (value) {
            subAnimation.startMode = value;
          }
        };
        inputs[name + '.' + 'startValue'] = {
          default: 0,
          set: function (value) {
            subAnimation.startValue = value;
          }
        };
        inputs[name + '.' + 'endValue'] = {
          default: 0,
          set: function (value) {
            subAnimation.endValue = value;
          }
        };

        this.registerInputs(inputs);

        this.registerOutput(name, {
          getter: function () {
            return subAnimation.currentValue;
          }
        });
      }
    },
    registerInputIfNeeded: {
      value: function (name) {
        if (this.hasInput(name)) {
          return;
        }

        var dotIndex = name.indexOf('.'),
          animationName = name.substr(0, dotIndex);

        if (this.hasOutput(animationName)) {
          return;
        }

        this._registerAnimationGroup(animationName);
      }
    },
    registerOutputIfNeeded: {
      value: function (name) {
        if (this.hasOutput(name)) {
          return;
        }

        this._registerAnimationGroup(name);
      }
    }
  }
};

module.exports = {
  node: AnimationNode
};
