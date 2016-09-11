'use strict';

var forEach = require('../../common/internal/forEach'),
    classChecks = require('../../common/var/classChecks');

var isArray = classChecks.isArray;

function arrayFlatten(arr, level, current) {
  var result = [];
  level = level || Infinity;
  current = current || 0;
  forEach(arr, function(el) {
    if (isArray(el) && current < level) {
      result = result.concat(arrayFlatten(el, level, current + 1));
    } else {
      result.push(el);
    }
  });
  return result;
}

module.exports = arrayFlatten;