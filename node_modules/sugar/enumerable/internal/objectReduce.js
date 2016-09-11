'use strict';

var isDefined = require('../../common/internal/isDefined'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

function objectReduce(obj, fn, acc) {
  var init = isDefined(acc);
  forEachProperty(obj, function(val, key) {
    if (!init) {
      acc = val;
      init = true;
      return;
    }
    acc = fn(acc, val, key, obj);
  });
  return acc;
}

module.exports = objectReduce;