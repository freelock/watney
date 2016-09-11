'use strict';

var Sugar = require('sugar-core'),
    isDefined = require('../../common/internal/isDefined'),
    classChecks = require('../../common/var/classChecks'),
    isPrimitive = require('../../common/internal/isPrimitive'),
    isUndefined = require('../../common/internal/isUndefined'),
    isObjectType = require('../../common/internal/isObjectType'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases'),
    getOwnPropertyNames = require('../var/getOwnPropertyNames'),
    getNewObjectForMerge = require('./getNewObjectForMerge'),
    iterateOverProperties = require('./iterateOverProperties'),
    coercePrimitiveToObject = require('../../common/internal/coercePrimitiveToObject'),
    mergeByPropertyDescriptor = require('./mergeByPropertyDescriptor');

var isDate = classChecks.isDate,
    isRegExp = classChecks.isRegExp,
    isFunction = classChecks.isFunction,
    getOwn = coreUtilityAliases.getOwn;

function objectMerge(target, source, deep, resolve, hidden, descriptor) {
  var resolveByFunction = isFunction(resolve), resolveConflicts = resolve !== false;

  if (isUndefined(target)) {
    target = getNewObjectForMerge(source);
  } else if (resolveConflicts && isDate(target) && isDate(source)) {
    // A date's timestamp is a property that can only be reached through its
    // methods, so actively set it up front if both are dates.
    target.setTime(source.getTime());
  }

  if (isPrimitive(target)) {
    // Will not merge into a primitive type, so simply override.
    return source;
  }

  // If the source object is a primitive
  // type then coerce it into an object.
  if (isPrimitive(source)) {
    source = coercePrimitiveToObject(source);
  }

  iterateOverProperties(hidden, source, function(val, key) {
    var sourceVal, targetVal, resolved, goDeep, result;

    sourceVal = source[key];

    // We are iterating over properties of the source, so hasOwnProperty on
    // it is guaranteed to always be true. However, the target may happen to
    // have properties in its prototype chain that should not be considered
    // as conflicts.
    targetVal = getOwn(target, key);

    if (resolveByFunction) {
      result = resolve(key, targetVal, sourceVal, target, source);
      if (isUndefined(result)) {
        // Result is undefined so do not merge this property.
        return;
      } else if (isDefined(result) && result !== Sugar) {
        // If the source returns anything except undefined, then the conflict
        // has been resolved, so don't continue traversing into the object. If
        // the returned value is the Sugar global object, then allowing Sugar
        // to resolve the conflict, so continue on.
        sourceVal = result;
        resolved = true;
      }
    } else if (isUndefined(sourceVal)) {
      // Will not merge undefined.
      return;
    }

    // Regex properties are read-only, so intentionally disallowing deep
    // merging for now. Instead merge by reference even if deep.
    goDeep = !resolved && deep && isObjectType(sourceVal) && !isRegExp(sourceVal);

    if (!goDeep && !resolveConflicts && isDefined(targetVal)) {
      return;
    }

    if (goDeep) {
      sourceVal = objectMerge(targetVal, sourceVal, deep, resolve, hidden, descriptor);
    }

    // getOwnPropertyNames is standing in as
    // a test for property descriptor support
    if (getOwnPropertyNames && descriptor) {
      mergeByPropertyDescriptor(target, source, key, sourceVal);
    } else {
      target[key] = sourceVal;
    }

  });
  return target;
}

module.exports = objectMerge;