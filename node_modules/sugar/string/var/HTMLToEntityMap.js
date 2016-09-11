'use strict';

var HTMLFromEntityMap = require('./HTMLFromEntityMap'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

var HTMLToEntityMap;

function buildEntities() {
  HTMLToEntityMap = {};
  forEachProperty(HTMLFromEntityMap, function(val, key) {
    HTMLToEntityMap[val] = '&' + key + ';';
  });
}

buildEntities();

module.exports = HTMLToEntityMap;