'use strict';

var matchInObject = require('./matchInObject'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

function selectFromObject(obj, f, select) {
  var match, result = {};
  f = [].concat(f);
  forEachProperty(obj, function(val, key) {
    match = false;
    for (var i = 0; i < f.length; i++) {
      if (matchInObject(f[i], key)) {
        match = true;
      }
    }
    if (match === select) {
      result[key] = val;
    }
  });
  return result;
}

module.exports = selectFromObject;