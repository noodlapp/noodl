'use strict';

const Timer = {
  name: 'Timer',
  docs: 'https://docs.noodl.net/nodes/utilities/delay',
  displayName: 'Delay',
  category: 'Utilities',
  nodeDoubleClickAction: {
    focusPort: 'duration'
  },
  initialize: function () {
    var self = this;
    this._internal._animation = this.context.timerScheduler.createTimer({
      duration: 0,
      onStart: function () {
        self.sendSignalOnOutput('timerStarted');
      },
      onFinish: function () {
        self.sendSignalOnOutput('timerFinished');
      }
    });

    this.addDeleteListener(() => {
      this._internal._animation.stop();
    });
  },
  getInspectInfo() {
    if (this._internal._animation.isRunning()) {
      return Math.floor(this._internal._animation.durationLeft() / 10) / 100 + ' seconds';
    }
    return 'Not running';
  },
  inputs: {
    start: {
      displayName: 'Start',
      valueChangedToTrue: function () {
        if (this._internal._animation._isRunning === false) {
          this._internal._animation.start();
        }
      }
    },
    restart: {
      displayName: 'Restart',
      valueChangedToTrue: function () {
        this._internal._animation.start();
      }
    },
    duration: {
      type: 'number',
      displayName: 'Duration',
      default: 0,
      set: function (value) {
        this._internal._animation.duration = value;
      }
    },
    startDelay: {
      type: 'number',
      displayName: 'Start Delay',
      default: 0,
      set: function (value) {
        this._internal._animation.delay = value;
      }
    },
    stop: {
      displayName: 'Stop',
      valueChangedToTrue: function () {
        this._internal._animation.stop();
      }
    }
  },
  outputs: {
    timerStarted: {
      type: 'signal',
      displayName: 'Started'
    },
    timerFinished: {
      type: 'signal',
      displayName: 'Finished'
    }
  }
};

module.exports = {
  node: Timer
};
