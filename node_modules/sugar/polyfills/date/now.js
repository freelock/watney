'use strict';

var Sugar = require('sugar-core');

Sugar.Date.defineStaticPolyfill({

  'now': function() {
    return new Date().getTime();
  }

});

// This package does not export anything as it is mapping a
// polyfill to Date.prototype which cannot be called statically.