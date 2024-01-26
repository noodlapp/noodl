class Transition {
  constructor() {
    this._frame = this.frame.bind(this);
  }

  start(args) {
    this.cb = args.end;

    if (this.timing.delay + this.timing.dur === 0) {
      this.end();
    } else {
      this.transitionForward = !args.back;
      this.startTime = window.performance.now();
      requestAnimationFrame(this._frame);
    }
  }

  frame() {
    var t = (window.performance.now() - (this.startTime + this.timing.delay)) / this.timing.dur;
    var _t = Math.max(0, Math.min(t, 1));

    this.transitionForward ? this.forward(_t) : this.back(_t);

    if (window.performance.now() <= this.startTime + this.timing.dur + this.timing.delay)
      requestAnimationFrame(this._frame);
    else this.end();
  }

  end() {
    this.cb && this.cb();
  }
}

module.exports = Transition;
