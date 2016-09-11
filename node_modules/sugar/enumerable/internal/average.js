'use strict';

var enumerateWithMapping = require('./enumerateWithMapping');

function average(obj, map) {
  var sum = 0, count = 0;
  enumerateWithMapping(obj, map, function(val) {
    sum += val;
    count++;
  });
  // Prevent divide by 0
  return sum / (count || 1);
}

module.exports = average;