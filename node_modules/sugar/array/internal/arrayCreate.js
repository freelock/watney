'use strict';

var isDefined = require('../../common/internal/isDefined'),
    arrayClone = require('./arrayClone'),
    classChecks = require('../../common/var/classChecks'),
    isObjectType = require('../../common/internal/isObjectType'),
    isArrayOrInherited = require('./isArrayOrInherited');

var isString = classChecks.isString;

function arrayCreate(obj, clone) {
  var arr;
  if (isArrayOrInherited(obj)) {
    arr = clone ? arrayClone(obj) : obj;
  } else if (isObjectType(obj) || isString(obj)) {
    arr = Array.from(obj);
  } else if (isDefined(obj)) {
    arr = [obj];
  }
  return arr || [];
}

module.exports = arrayCreate;