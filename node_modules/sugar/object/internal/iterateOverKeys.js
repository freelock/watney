'use strict';

var getOwnPropertyDescriptor = require('../var/getOwnPropertyDescriptor');

function iterateOverKeys(getFn, obj, fn, hidden) {
  var keys = getFn(obj), desc;
  for (var i = 0, key; key = keys[i]; i++) {
    desc = getOwnPropertyDescriptor(obj, key);
    if (desc.enumerable || hidden) {
      fn(obj[key], key);
    }
  }
}

module.exports = iterateOverKeys;