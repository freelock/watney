'use strict';

var Sugar = require('sugar-core'),
    setDelay = require('./internal/setDelay');

Sugar.Function.defineInstanceWithArguments({

  'delay': function(fn, ms, args) {
    setDelay(fn, ms, fn, fn, args);
    return fn;
  }

});

module.exports = Sugar.Function.delay;