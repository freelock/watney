'use strict';

function fixArgumentLength(fn) {
  var staticFn = function(a) {
    var args = arguments;
    return fn(a, args[1], args[2], args.length - 1);
  };
  staticFn.instance = function(b) {
    var args = arguments;
    return fn(this, b, args[1], args.length);
  };
  return staticFn;
}

module.exports = fixArgumentLength;