'use strict';

var Sugar = require('sugar-core'),
    TRIM_REG = require('../../es5/var/TRIM_REG');

Sugar.String.defineInstancePolyfill({

  'trim': function() {
    return this.toString().replace(TRIM_REG, '');
  }

});

// This package does not export anything as it is mapping a
// polyfill to String.prototype which cannot be called statically.