'use strict';

var EaseCurves = {
  easeOutQuartic: function (start, end, t) {
    t--;
    return -(end - start) * (t * t * t * t - 1.0) + start;
  },
  easeInQuartic: function (start, end, t) {
    return (end - start) * (t * t * t * t) + start;
  },
  easeInOutQuartic: function (start, end, t) {
    t *= 2.0;
    if (t < 1.0) {
      return ((end - start) / 2.0) * t * t * t * t + start;
    }
    t -= 2.0;
    return (-(end - start) / 2.0) * (t * t * t * t - 2.0) + start;
  },
  easeOutCubic: function (start, end, t) {
    t--;
    return (end - start) * (t * t * t + 1.0) + start;
  },
  easeInCubic: function (start, end, t) {
    return (end - start) * (t * t * t) + start;
  },
  easeInOutCubic: function (start, end, t) {
    t *= 2.0;
    if (t < 1.0) {
      return ((end - start) / 2.0) * t * t * t + start;
    }
    t -= 2.0;
    return ((end - start) / 2.0) * (t * t * t + 2.0) + start;
  },
  easeOutQuadratic: function (start, end, t) {
    return -(end - start) * t * (t - 2.0) + start;
  },
  easeInQuadratic: function (start, end, t) {
    return (end - start) * (t * t) + start;
  },
  easeInOutQuadratic: function (start, end, t) {
    t *= 2.0;
    if (t < 1.0) {
      return ((end - start) / 2.0) * t * t + start;
    }
    t -= 1.0;
    return (-(end - start) / 2.0) * (t * (t - 2) - 1.0) + start;
  },
  linear: function (start, end, t) {
    return start + (end - start) * t;
  }
};

//default interpolation curves
EaseCurves.easeIn = EaseCurves.easeInCubic;
EaseCurves.easeOut = EaseCurves.easeOutCubic;
EaseCurves.easeInOut = EaseCurves.easeInOutCubic;

module.exports = EaseCurves;
