'use strict';

var Sugar = require('sugar-core'),
    isRealNaN = require('../../common/internal/isRealNaN');

Sugar.Number.defineStaticPolyfill({

  'isNaN': function(obj) {
    return isRealNaN(obj);
  }

});

// This package does not export anything as it is mapping a
// polyfill to Number.prototype which cannot be called statically.