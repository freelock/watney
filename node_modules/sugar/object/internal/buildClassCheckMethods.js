'use strict';

var NATIVE_TYPES = require('../../common/var/NATIVE_TYPES'),
    classChecks = require('../../common/var/classChecks'),
    namespaceAliases = require('../../common/var/namespaceAliases'),
    defineInstanceAndStaticSimilar = require('../../common/internal/defineInstanceAndStaticSimilar');

var isBoolean = classChecks.isBoolean,
    isNumber = classChecks.isNumber,
    isString = classChecks.isString,
    isDate = classChecks.isDate,
    isRegExp = classChecks.isRegExp,
    isFunction = classChecks.isFunction,
    isArray = classChecks.isArray,
    isSet = classChecks.isSet,
    isMap = classChecks.isMap,
    isError = classChecks.isError,
    sugarObject = namespaceAliases.sugarObject;

function buildClassCheckMethods() {
  var checks = [isBoolean, isNumber, isString, isDate, isRegExp, isFunction, isArray, isError, isSet, isMap];
  defineInstanceAndStaticSimilar(sugarObject, NATIVE_TYPES, function(methods, name, i) {
    methods['is' + name] = checks[i];
  });
}

module.exports = buildClassCheckMethods;