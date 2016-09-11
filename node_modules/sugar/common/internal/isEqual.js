'use strict';

var getKeys = require('./getKeys'),
    setToArray = require('./setToArray'),
    mapToArray = require('./mapToArray'),
    classChecks = require('../var/classChecks'),
    isObjectType = require('./isObjectType'),
    coreUtilityAliases = require('../var/coreUtilityAliases'),
    iterateWithCyclicCheck = require('./iterateWithCyclicCheck');

var classToString = coreUtilityAliases.classToString,
    isSerializable = classChecks.isSerializable,
    isSet = classChecks.isSet,
    isMap = classChecks.isMap,
    isError = classChecks.isError;

function isEqual(a, b, stack) {
  var aClass, bClass;
  if (a === b) {
    // Return quickly up front when matched by reference,
    // but be careful about 0 !== -0.
    return a !== 0 || 1 / a === 1 / b;
  }
  aClass = classToString(a);
  bClass = classToString(b);
  if (aClass !== bClass) {
    return false;
  }

  if (isSerializable(a, aClass) && isSerializable(b, bClass)) {
    return objectIsEqual(a, b, aClass, stack);
  } else if (isSet(a, aClass) && isSet(b, bClass)) {
    return a.size === b.size && isEqual(setToArray(a), setToArray(b), stack);
  } else if (isMap(a, aClass) && isMap(b, bClass)) {
    return a.size === b.size && isEqual(mapToArray(a), mapToArray(b), stack);
  } else if (isError(a, aClass) && isError(b, bClass)) {
    return a.toString() === b.toString();
  }

  return false;
}

function objectIsEqual(a, b, aClass, stack) {
  var aType = typeof a, bType = typeof b, propsEqual, count;
  if (aType !== bType) {
    return false;
  }
  if (isObjectType(a.valueOf())) {
    if (a.length !== b.length) {
      // perf: Quickly returning up front for arrays.
      return false;
    }
    count = 0;
    propsEqual = true;
    iterateWithCyclicCheck(a, false, stack, function(key, val, cyc, stack) {
      if (!cyc && (!(key in b) || !isEqual(val, b[key], stack))) {
        propsEqual = false;
      }
      count++;
      return propsEqual;
    });
    if (!propsEqual || count !== getKeys(b).length) {
      return false;
    }
  }
  // Stringifying the value handles NaN, wrapped primitives, dates, and errors in one go.
  return a.valueOf().toString() === b.valueOf().toString();
}

module.exports = isEqual;