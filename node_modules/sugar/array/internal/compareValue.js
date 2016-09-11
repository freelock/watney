'use strict';

var ARRAY_OPTIONS = require('../var/ARRAY_OPTIONS'),
    classChecks = require('../../common/var/classChecks');

var isString = classChecks.isString,
    isArray = classChecks.isArray,
    _arrayOptions = ARRAY_OPTIONS._arrayOptions;

function compareValue(aVal, bVal) {
  var cmp, i, collate;
  if (isString(aVal) && isString(bVal)) {
    collate = _arrayOptions('sortCollate');
    return collate(aVal, bVal);
  } else if (isArray(aVal) && isArray(bVal)) {
    if (aVal.length < bVal.length) {
      return -1;
    } else if (aVal.length > bVal.length) {
      return 1;
    } else {
      for(i = 0; i < aVal.length; i++) {
        cmp = compareValue(aVal[i], bVal[i]);
        if (cmp !== 0) {
          return cmp;
        }
      }
      return 0;
    }
  }
  return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
}

module.exports = compareValue;