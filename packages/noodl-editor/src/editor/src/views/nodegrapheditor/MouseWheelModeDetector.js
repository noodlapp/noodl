const NavigationModeMouse = 'mouse';
const NavigationModeTouchPad = 'touchpad';

class MouseWheelModeDetector {
  constructor() {
    this.firstWheelDeltaYInTimeFrame = null;
    this.endTimeFrame = this.endTimeFrameHandler.bind(this);
    this.mode = NavigationModeMouse;
  }

  dispose() {
    clearTimeout(this.checkTimeFrameEndedID);
  }

  changeMode(e) {
    this.startTimeFrame();
    this.mode = this.getModeByWheelEvent(e);
    return this.mode;
  }

  startTimeFrame() {
    this.startFrameTime = Date.now();
    clearTimeout(this.checkTimeFrameEndedID);
    this.checkTimeFrameEndedID = setTimeout(this.endTimeFrame, 100);
  }

  endTimeFrameHandler() {
    this.startFrameTime = 0;
    this.firstWheelDeltaYInTimeFrame = null;
  }

  getModeByWheelEvent(e) {
    var t = this.mode;
    switch (t) {
      case NavigationModeMouse:
        return this.detectTouchpad(e) ? NavigationModeTouchPad : t;
      case NavigationModeTouchPad:
        return this.detectMouse(e) ? NavigationModeMouse : t;
      default:
        return t;
    }
  }

  detectMouse(e) {
    //panning events from a trackpad always have ctrlKey set to true. Just assume it's a trackpad
    if (e.ctrlKey) {
      return false;
    }

    if (e.wheelDeltaY !== 0 && e.wheelDeltaY !== null && this.firstWheelDeltaYInTimeFrame === null) {
      this.firstWheelDeltaYInTimeFrame = Math.abs(e.wheelDeltaY);

      //after some testing it appears that mice always report a deltaY of 120, 240 etc in the very first wheel event.
      //Trackpads are more "smooth" with lower values.
      const mouseDetected = this.firstWheelDeltaYInTimeFrame % 120 === 0;
      return mouseDetected;
    }

    return false;
  }

  detectTouchpad(e) {
    //panning events from a trackpad always have ctrlKey set to true. Just assume it's a trackpad
    if (e.ctrlKey) {
      return true;
    }

    if (e.deltaX === 0 || e.shiftKey) {
      return false;
    }

    return true;
  }
}

module.exports = MouseWheelModeDetector;
