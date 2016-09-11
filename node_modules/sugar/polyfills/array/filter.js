'use strict';

var Sugar = require('sugar-core'),
    assertCallable = require('../../common/internal/assertCallable');

Sugar.Array.defineInstancePolyfill({

  'filter': function(fn) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, context = arguments[1];
    var length = this.length, index = 0, result = [];
    assertCallable(fn);
    while(index < length) {
      if (index in this && fn.call(context, this[index], index, this)) {
        result.push(this[index]);
      }
      index++;
    }
    return result;
  }

});

// This package does not export anything as it is mapping a
// polyfill to Array.prototype which cannot be called statically.