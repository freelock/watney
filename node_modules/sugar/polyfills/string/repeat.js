'use strict';

var Sugar = require('sugar-core'),
    repeatString = require('../../common/internal/repeatString'),
    coercePositiveInteger = require('../../common/internal/coercePositiveInteger');

Sugar.String.defineInstancePolyfill({

  'repeat': function(num) {
    num = coercePositiveInteger(num);
    return repeatString(this, num);
  }

});

// This package does not export anything as it is mapping a
// polyfill to String.prototype which cannot be called statically.