'use strict';

var Sugar = require('sugar-core'),
    hasISOSupport = require('../../es5/internal/hasISOSupport');

Sugar.Date.defineInstancePolyfill({

  'toJSON': function(key) {
    // Force compiler to respect argument length.
    var argLen = arguments.length;
    return this.toISOString(key);
  }

}, !hasISOSupport());

// This package does not export anything as it is mapping a
// polyfill to Date.prototype which cannot be called statically.