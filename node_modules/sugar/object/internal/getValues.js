'use strict';

var coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

function getValues(obj) {
  var values = [];
  forEachProperty(obj, function(val) {
    values.push(val);
  });
  return values;
}

module.exports = getValues;