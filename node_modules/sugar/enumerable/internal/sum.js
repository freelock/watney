'use strict';

var enumerateWithMapping = require('./enumerateWithMapping');

function sum(obj, map) {
  var sum = 0;
  enumerateWithMapping(obj, map, function(val) {
    sum += val;
  });
  return sum;
}

module.exports = sum;