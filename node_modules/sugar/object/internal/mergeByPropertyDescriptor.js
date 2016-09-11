'use strict';

var isDefined = require('../../common/internal/isDefined'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases'),
    getOwnPropertyDescriptor = require('../var/getOwnPropertyDescriptor');

var defineProperty = coreUtilityAliases.defineProperty;

function mergeByPropertyDescriptor(target, source, prop, sourceVal) {
  var descriptor = getOwnPropertyDescriptor(source, prop);
  if (isDefined(descriptor.value)) {
    descriptor.value = sourceVal;
  }
  defineProperty(target, prop, descriptor);
}

module.exports = mergeByPropertyDescriptor;