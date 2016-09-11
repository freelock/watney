'use strict';

var forEach = require('../../common/internal/forEach'),
    arrayClone = require('./arrayClone'),
    classChecks = require('../../common/var/classChecks');

var isArray = classChecks.isArray;

function arraySafeConcat(arr, arg) {
  var result = arrayClone(arr), len = result.length, arr2;
  arr2 = isArray(arg) ? arg : [arg];
  result.length += arr2.length;
  forEach(arr2, function(el, i) {
    result[len + i] = el;
  });
  return result;
}

module.exports = arraySafeConcat;