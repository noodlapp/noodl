module.exports = function patchedMomentum(current, start, time, lowerMargin, upperMargin, wrapperSize, options) {
  if (options === void 0) {
    options = this.options;
  }
  var distance = current - start;
  var speed = Math.abs(distance) / time;
  var deceleration = options.deceleration,
    swipeBounceTime = options.swipeBounceTime,
    swipeTime = options.swipeTime;
  var momentumData = {
    destination: current + (speed / deceleration) * (distance < 0 ? -1 : 1),
    duration: swipeTime,
    rate: 15
  };
  this.hooks.trigger(this.hooks.eventTypes.momentum, momentumData, distance);
  if (momentumData.destination < lowerMargin) {
    momentumData.destination = wrapperSize
      ? Math.max(lowerMargin - wrapperSize / 4, lowerMargin - (wrapperSize / momentumData.rate) * speed)
      : lowerMargin;
    momentumData.duration = Math.abs(momentumData.destination - current) / speed;
  } else if (momentumData.destination > upperMargin) {
    momentumData.destination = wrapperSize
      ? Math.min(upperMargin + wrapperSize / 4, upperMargin + (wrapperSize / momentumData.rate) * speed)
      : upperMargin;
    // momentumData.duration = swipeBounceTime;
    momentumData.duration = Math.abs(momentumData.destination - current) / speed;
  }
  momentumData.destination = Math.round(momentumData.destination);
  return momentumData;
};
