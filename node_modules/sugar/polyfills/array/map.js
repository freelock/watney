'use strict';

var Sugar = require('sugar-core'),
    assertCallable = require('../../common/internal/assertCallable');

Sugar.Array.defineInstancePolyfill({

  'map': function(fn) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, context = arguments[1];
    var length = this.length, index = 0, result = new Array(length);
    assertCallable(fn);
    while(index < length) {
      if (index in this) {
        result[index] = fn.call(context, this[index], index, this);
      }
      index++;
    }
    return result;
  }

});

// This package does not export anything as it is mapping a
// polyfill to Array.prototype which cannot be called statically.