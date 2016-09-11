'use strict';

var trunc = require('../../common/var/trunc'),
    enumerateWithMapping = require('./enumerateWithMapping');

function median(obj, map) {
  var result = [], middle, len;
  enumerateWithMapping(obj, map, function(val) {
    result.push(val);
  });
  len = result.length;
  if (!len) return 0;
  result.sort(function(a, b) {
    // IE7 will throw errors on non-numbers!
    return (a || 0) - (b || 0);
  });
  middle = trunc(len / 2);
  return len % 2 ? result[middle] : (result[middle - 1] + result[middle]) / 2;
}

module.exports = median;