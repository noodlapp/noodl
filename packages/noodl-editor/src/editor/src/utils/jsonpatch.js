if (typeof Array.isArray === 'undefined') {
  Array.isArray = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };
}

module.exports = {
  diff: function (base, compared, _p) {
    var path = _p || '';
    var ops = [];

    // Loop through the compared object
    for (idx in compared) {
      var value = compared[idx];

      // Recurse into object
      if (typeof value === 'object' && base.hasOwnProperty(idx)) {
        ops = ops.concat(this.diff(base[idx], value, path + '/' + idx));
      }
      // To get the added items
      else if (!base.hasOwnProperty(idx)) {
        ops.push({
          op: 'add',
          path: path + '/' + idx,
          value: value
        });

        // The updated items
      } else if (value !== base[idx]) {
        ops.push({
          op: 'replace',
          path: path + '/' + idx,
          value: value
        });

        // And the unchanged
      } else if (value === base[idx]) {
      }
    }

    // Loop through the before object
    for (idx in base) {
      var value = base[idx];

      // To get the deleted items
      if (!(idx in compared)) {
        ops.push({
          op: 'remove',
          path: path + '/' + idx
        });
      }
    }

    return ops;
  },
  hash: function (o) {
    var s = JSON.stringify(o);
    var hash = 0;
    if (s.length == 0) {
      return hash;
    }
    for (var i = 0; i < s.length; i++) {
      var char = s.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  },
  resolvePath: function (base, path) {
    var p = path.split('/');
    if (p[0] === '') p.shift(); // Remove leading empty
    var field = p.pop();

    var ref = base;
    for (var j = 0; j < p.length; j++) ref = ref[p[j]];

    return {
      ref: ref,
      field: field
    };
  },
  patch: function (base, ops) {
    var patched = JSON.parse(JSON.stringify(base));

    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      var p = op.path.split('/');
      if (p[0] === '') p.shift(); // Remove leading empty
      var field = p.pop();

      var ref = patched;
      for (var j = 0; j < p.length; j++) ref = ref[p[j]];

      if (op.op === 'remove') {
        delete ref[field];
      } else {
        if (Array.isArray(ref) && op.op === 'add' && field === '-') ref.push(op.value);
        else ref[field] = op.value;
      }
    }

    // Purge "undefined" slots in arrays
    function purgeUndef(o) {
      for (var key in o) {
        var v = o[key];
        if (Array.isArray(v)) {
          o[key] = v.filter(function (i) {
            return i !== undefined;
          });
        } else if (typeof v === 'object') purgeUndef(v);
      }
    }
    purgeUndef(patched);

    return patched;
  }
};
