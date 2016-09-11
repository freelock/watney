'use strict';

var classChecks = require('../../common/var/classChecks'),
    isObjectType = require('../../common/internal/isObjectType'),
    internalToString = require('../var/internalToString'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases'),
    getURIComponentValue = require('./getURIComponentValue'),
    sanitizeURIComponent = require('./sanitizeURIComponent');

var isArray = classChecks.isArray,
    forEachProperty = coreUtilityAliases.forEachProperty;

function toQueryString(obj, deep, transform, prefix, separator) {
  if (isArray(obj)) {
    return collectArrayAsQueryString(obj, deep, transform, prefix, separator);
  } else if (isObjectType(obj) && obj.toString === internalToString) {
    return collectObjectAsQueryString(obj, deep, transform, prefix, separator);
  } else if (prefix) {
    return getURIComponentValue(obj, prefix, transform);
  }
  return '';
}

function collectArrayAsQueryString(arr, deep, transform, prefix, separator) {
  var el, qc, key, result = [];
  // Intentionally treating sparse arrays as dense here by avoiding map,
  // otherwise indexes will shift during the process of serialization.
  for (var i = 0, len = arr.length; i < len; i++) {
    el = arr[i];
    key = prefix + (prefix && deep ? '[]' : '');
    if (!key && !isObjectType(el)) {
      // If there is no key, then the values of the array should be
      // considered as null keys, so use them instead;
      qc = sanitizeURIComponent(el);
    } else {
      qc = toQueryString(el, deep, transform, key, separator);
    }
    result.push(qc);
  }
  return result.join('&');
}

function collectObjectAsQueryString(obj, deep, transform, prefix, separator) {
  var result = [];
  forEachProperty(obj, function(val, key) {
    var fullKey;
    if (prefix && deep) {
      fullKey = prefix + '[' + key + ']';
    } else if (prefix) {
      fullKey = prefix + separator + key;
    } else {
      fullKey = key;
    }
    result.push(toQueryString(val, deep, transform, fullKey, separator));
  });
  return result.join('&');
}

module.exports = toQueryString;