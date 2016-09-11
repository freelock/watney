'use strict';

var Sugar = require('sugar-core'),
    assertCallable = require('../../common/internal/assertCallable');

Sugar.Array.defineInstancePolyfill({

  'findIndex': function(f) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, context = arguments[1];
    assertCallable(f);
    for (var i = 0, len = this.length; i < len; i++) {
      if (f.call(context, this[i], i, this)) {
        return i;
      }
    }
    return -1;
  }

});

// This package does not export anything as it is mapping a
// polyfill to Array.prototype which cannot be called statically.