'use strict';

var filter = require('../../common/internal/filter');

function arrayCompact(arr, all) {
  return filter(arr, function(el) {
    return el || (!all && el != null && el.valueOf() === el.valueOf());
  });
}

module.exports = arrayCompact;