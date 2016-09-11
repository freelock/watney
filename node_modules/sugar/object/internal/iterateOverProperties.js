'use strict';

var iterateOverKeys = require('./iterateOverKeys'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases'),
    getOwnPropertyNames = require('../var/getOwnPropertyNames'),
    getOwnPropertySymbols = require('../var/getOwnPropertySymbols');

var forEachProperty = coreUtilityAliases.forEachProperty;

function iterateOverProperties(hidden, obj, fn) {
  if (getOwnPropertyNames && hidden) {
    iterateOverKeys(getOwnPropertyNames, obj, fn, hidden);
  } else {
    forEachProperty(obj, fn);
  }
  if (getOwnPropertySymbols) {
    iterateOverKeys(getOwnPropertySymbols, obj, fn, hidden);
  }
}

module.exports = iterateOverProperties;