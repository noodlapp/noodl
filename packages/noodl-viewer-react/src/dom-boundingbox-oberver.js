export default class DOMBoundingBoxObserver {
  constructor(callback, pollDelay) {
    this.isRunning = false;
    this.numBoundingBoxObservers = 0;
    this.callback = callback;
    this.pollDelay = pollDelay;
  }

  addObserver() {
    this.numBoundingBoxObservers++;

    if (!this.isRunning) {
      this._startObserver();
    }
  }

  removeObserver() {
    this.numBoundingBoxObservers--;
    if (this.numBoundingBoxObservers === 0) {
      this._stopObserver();
    }
  }

  setTarget(target) {
    this.target = target;
    if (this.numBoundingBoxObservers > 0 && !this.isRunning) {
      this._startObserver();
    }
  }

  _startObserver() {
    if (this.isRunning) return;
    if (!this.target) return;

    this.isRunning = true;

    let boundingRect = {};
    const observer = () => {
      if (!this.target) {
        this.isRunning = false;
        return;
      }

      const bb = this.target.getBoundingClientRect();
      if (boundingRect.x !== bb.x) {
        this.callback('x', bb);
      }
      if (boundingRect.y !== bb.y) {
        this.callback('y', bb);
      }
      if (boundingRect.width !== bb.width) {
        this.callback('width', bb);
      }
      if (boundingRect.height !== bb.height) {
        this.callback('height', bb);
      }
      boundingRect = bb;

      if (this.isRunning) {
        if (this.pollDelay) {
          setTimeout(observer, this.pollDelay);
        } else {
          //poll as quickly as possible
          window.requestAnimationFrame(observer);
        }
      }
    };

    window.requestAnimationFrame(observer);
  }

  _stopObserver() {
    this.isRunning = false;
  }
}
