'use strict';

var isPrimitive = require('./isPrimitive'),
    classChecks = require('../var/classChecks'),
    dateMatcher = require('./dateMatcher'),
    regexMatcher = require('./regexMatcher'),
    isObjectType = require('./isObjectType'),
    isPlainObject = require('./isPlainObject'),
    defaultMatcher = require('./defaultMatcher'),
    functionMatcher = require('./functionMatcher'),
    coreUtilityAliases = require('../var/coreUtilityAliases');

var getOwn = coreUtilityAliases.getOwn,
    classToString = coreUtilityAliases.classToString,
    forEachProperty = coreUtilityAliases.forEachProperty,
    isDate = classChecks.isDate,
    isRegExp = classChecks.isRegExp,
    isFunction = classChecks.isFunction;

function getMatcher(f) {
  if (!isPrimitive(f)) {
    var className = classToString(f);
    if (isRegExp(f, className)) {
      return regexMatcher(f);
    } else if (isDate(f, className)) {
      return dateMatcher(f);
    } else if (isFunction(f, className)) {
      return functionMatcher(f);
    } else if (isPlainObject(f, className)) {
      return fuzzyMatcher(f);
    }
  }
  // Default is standard isEqual
  return defaultMatcher(f);
}

function fuzzyMatcher(obj) {
  var matchers = {};
  return function(el, i, arr) {
    var matched = true;
    if (!isObjectType(el)) {
      return false;
    }
    forEachProperty(obj, function(val, key) {
      matchers[key] = getOwn(matchers, key) || getMatcher(val);
      if (matchers[key].call(arr, el[key], i, arr) === false) {
        matched = false;
      }
      return matched;
    });
    return matched;
  };
}

module.exports = getMatcher;