'use strict';

var DONT_ENUM_PROPS = require('../var/DONT_ENUM_PROPS'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var hasOwn = coreUtilityAliases.hasOwn,
    forEachProperty = coreUtilityAliases.forEachProperty;

function buildDontEnumFix() {
  if (!({toString:1}).propertyIsEnumerable('toString')) {
    var forEachEnumerableProperty = forEachProperty;
    forEachProperty = function(obj, fn) {
      forEachEnumerableProperty(obj, fn);
      for (var i = 0, key; key = DONT_ENUM_PROPS[i]; i++) {
        if (hasOwn(obj, key)) {
          if(fn.call(obj, obj[key], key, obj) === false) break;
        }
      }
    };
  }
}

buildDontEnumFix();

coreUtilityAliases.forEachProperty = forEachProperty;