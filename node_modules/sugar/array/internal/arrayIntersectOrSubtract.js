'use strict';

var forEach = require('../../common/internal/forEach'),
    arrayWrap = require('./arrayWrap'),
    classChecks = require('../../common/var/classChecks'),
    serializeInternal = require('../../common/internal/serializeInternal'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var isArray = classChecks.isArray,
    hasOwn = coreUtilityAliases.hasOwn;

function arrayIntersectOrSubtract(arr1, arr2, subtract) {
  var result = [], obj = {}, refs = [];
  if (!isArray(arr2)) {
    arr2 = arrayWrap(arr2);
  }
  forEach(arr2, function(el) {
    obj[serializeInternal(el, refs)] = true;
  });
  forEach(arr1, function(el) {
    var key = serializeInternal(el, refs);
    if (hasOwn(obj, key) !== subtract) {
      delete obj[key];
      result.push(el);
    }
  });
  return result;
}

module.exports = arrayIntersectOrSubtract;