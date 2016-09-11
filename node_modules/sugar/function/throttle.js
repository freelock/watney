'use strict';

var Sugar = require('sugar-core'),
    createLazyFunction = require('./internal/createLazyFunction');

Sugar.Function.defineInstance({

  'throttle': function(fn, ms) {
    return createLazyFunction(fn, ms, true, 1);
  }

});

module.exports = Sugar.Function.throttle;