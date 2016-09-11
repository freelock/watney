'use strict';

var assertArgument = require('../../common/internal/assertArgument');

function wrapNativeArrayMethod(methodName, wrapper) {
  var nativeFn = Array.prototype[methodName];
  return function(arr, f, context, argsLen) {
    var args = new Array(2);
    assertArgument(argsLen > 0);
    args[0] = wrapper(f, context);
    args[1] = context;
    return nativeFn.apply(arr, args);
  };
}

module.exports = wrapNativeArrayMethod;