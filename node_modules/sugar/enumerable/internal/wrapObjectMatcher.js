'use strict';

var getKeys = require('../../common/internal/getKeys'),
    getMatcher = require('../../common/internal/getMatcher');

function wrapObjectMatcher(name) {
  var nativeFn = Array.prototype[name];
  return function(obj, f) {
    var matcher = getMatcher(f);
    return nativeFn.call(getKeys(obj), function(key) {
      return matcher(obj[key], key, obj);
    });
  };
}

module.exports = wrapObjectMatcher;