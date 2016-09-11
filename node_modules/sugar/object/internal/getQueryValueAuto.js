'use strict';

var classChecks = require('../../common/var/classChecks'),
    stringIsDecimal = require('./stringIsDecimal'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var getOwn = coreUtilityAliases.getOwn,
    isArray = classChecks.isArray;

function getQueryValueAuto(obj, key, val) {
  if (!val) {
    return null;
  } else if (val === 'true') {
    return true;
  } else if (val === 'false') {
    return false;
  }
  var num = +val;
  if (!isNaN(num) && stringIsDecimal(val)) {
    return num;
  }
  var existing = getOwn(obj, key);
  if (val && existing) {
    return isArray(existing) ? existing.concat(val) : [existing, val];
  }
  return val;
}

module.exports = getQueryValueAuto;