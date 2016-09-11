'use strict';

var Sugar = require('sugar-core'),
    createLazyFunction = require('./internal/createLazyFunction');

Sugar.Function.defineInstance({

  'lazy': function(fn, ms, immediate, limit) {
    return createLazyFunction(fn, ms, immediate, limit);
  }

});

module.exports = Sugar.Function.lazy;