'use strict';

var classChecks = require('../../common/var/classChecks'),
    isPrimitive = require('../../common/internal/isPrimitive'),
    isPlainObject = require('../../common/internal/isPlainObject'),
    getRegExpFlags = require('../../common/internal/getRegExpFlags'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var classToString = coreUtilityAliases.classToString,
    isDate = classChecks.isDate,
    isRegExp = classChecks.isRegExp,
    isArray = classChecks.isArray;

function getNewObjectForMerge(source) {
  var klass = classToString(source);
  // Primitive types, dates, and regexes have no "empty" state. If they exist
  // at all, then they have an associated value. As we are only creating new
  // objects when they don't exist in the target, these values can come alone
  // for the ride when created.
  if (isArray(source, klass)) {
    return [];
  } else if (isPlainObject(source, klass)) {
    return {};
  } else if (isDate(source, klass)) {
    return new Date(source.getTime());
  } else if (isRegExp(source, klass)) {
    return RegExp(source.source, getRegExpFlags(source));
  } else if (isPrimitive(source && source.valueOf())) {
    return source;
  }
  // If the object is not of a known type, then simply merging its
  // properties into a plain object will result in something different
  // (it will not respond to instanceof operator etc). Similarly we don't
  // want to call a constructor here as we can't know for sure what the
  // original constructor was called with (Events etc), so throw an
  // error here instead. Non-standard types can be handled if either they
  // already exist and simply have their properties merged, if the merge
  // is not deep so their references will simply be copied over, or if a
  // resolve function is used to assist the merge.
  throw new TypeError('Must be a basic data type');
}

module.exports = getNewObjectForMerge;