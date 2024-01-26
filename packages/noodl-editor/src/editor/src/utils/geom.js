module.exports = {
  interp: function (t, t0, t1, ease) {
    if (t <= t0) {
      return 0;
    }

    if (t >= t1) {
      return 1;
    }

    var delta = t1 - t0;
    var u = 0;
    if (delta > 0) u = (t - t0) / (t1 - t0);

    if (ease == 'out') {
      var u2 = u * u;

      u = 2 * u - u2;
    } else if (ease == 'in') {
      u = u * u;
    } else if (ease == 'inout') {
      var u2 = u * u;
      var u3 = u2 * u;

      u = 3 * u2 - 2 * u3;
    }

    return u;
  }
};
