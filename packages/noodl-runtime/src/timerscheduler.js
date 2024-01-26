'use strict';

function Timer(scheduler, args) {
    this.duration = args.duration || 0;
    this._isRunning = false;
    this._hasCalledOnStart = false;
    this.scheduler = scheduler;
    this.repeatCount = 1;
    this.delay = 0;

    for(var arg in args) {
        this[arg] = args[arg];
    }
}

Timer.prototype.start = function() {
    if(this._isRunning) {
        this.stop();
    }

    this.scheduler.scheduleTimer(this);
    return this;
};

Timer.prototype.stop = function() {
    this.scheduler.stopTimer(this);
    this._hasCalledOnStart = false;
    this._isRunning = false;
    this._wasStopped = true;    // This is used to avoid calling onFinish
};

Timer.prototype.isRunning = function() {
    return this._isRunning;
};

Timer.prototype.durationLeft = function() {
    return this._durationLeft;
};

function TimerScheduler(requestFrameCallback) {
    this.requestFrame = requestFrameCallback;
    this.runningTimers = [];
    this.newTimers = [];
}

TimerScheduler.prototype.createTimer = function(args) {
    return new Timer(this, args);
};

TimerScheduler.prototype.scheduleTimer = function(timer) {
    if(this.newTimers.indexOf(timer) === -1) {
        if(timer.repeatCount === 0) {
            timer.repeatCount = 100000;
        }

        this.newTimers.push(timer);
        this.requestFrame();
    }
};

TimerScheduler.prototype.stopTimer = function(timer) {
    var index;

    if(timer._isRunning) {
        index = this.runningTimers.indexOf(timer);
        if(index !== -1) {
            this.runningTimers.splice(index, 1);
        }

        if (timer.onStop && !timer._wasStopped) {
            timer.onStop();
        }
    }
    else {
        index = this.newTimers.indexOf(timer);
        if(index !== -1) {
            this.newTimers.splice(index, 1);
        }
    }
};

TimerScheduler.prototype.runTimers = function(currentTime) {

    var remainingTimers = [],
        finishedTimers = [],
        timersThisFrame = [];

    var i,
        len = this.runningTimers.length,
        timer;

    //copy timer list in case timers are added or removed during onStart or onRunning
    for(i=0; i<len; ++i) {
        timersThisFrame[i] = this.runningTimers[i];
    }

    for(i=0; i<len; ++i) {
        timer = timersThisFrame[i];
        if(timer && currentTime >= timer._start) {

            if(timer._hasCalledOnStart === false && timer.onStart) {
                timer.onStart();
                timer._hasCalledOnStart = true;
            }

            var t;
            if(timer.duration > 0) {
                t = (currentTime - timer._start)/(timer.duration*timer.repeatCount);
            } else {
                t = 1.0;
            }

            timer._durationLeft = timer.duration * (1-t);

            var localT = t*timer.repeatCount - Math.floor(t*timer.repeatCount);
            if(t >= 1.0) {
                localT = 1.0;
            }

            if(timer.onRunning) {
                timer.onRunning(localT);
            }

            if(t < 1.0 && timer._isRunning) {
                remainingTimers.push(timer);
            }
            else if (!timer._wasStopped) {
                finishedTimers.push(timer);
            }
        } else {
            remainingTimers.push(timer);
        }
    }

    this.runningTimers = remainingTimers;

    for(i=0; i<finishedTimers.length; ++i) {
        finishedTimers[i]._isRunning = false;
        finishedTimers[i]._hasCalledOnStart = false;
        if( finishedTimers[i].onFinish ) {
            finishedTimers[i].onFinish();
        }
    }

    //add newly queued timers
    if(this.newTimers.length > 0) {
        for(i=0; i<this.newTimers.length; ++i) {
            timer = this.newTimers[i];
            timer._start = currentTime + timer.delay;
            timer._isRunning = true;
            timer._wasStopped = false;
            this.runningTimers.push(timer);

            if(timer.delay === 0) {
                //play first timer frame directly to keep everything nicely synched
                if(timer.onStart) {
                    timer.onStart();
                    timer._hasCalledOnStart = true;
                }
                if(timer.onRunning) {
                    timer.onRunning(0);
                }
            }
        }
        this.newTimers.length = 0;
    }
};

TimerScheduler.prototype.hasPendingTimers = function() {
    return this.runningTimers.length > 0 || this.newTimers.length > 0;
};

module.exports = TimerScheduler;
