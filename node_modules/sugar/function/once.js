'use strict';

var Sugar = require('sugar-core');

Sugar.Function.defineInstance({

  'once': function(fn) {
    var called = false, val;
    return function() {
      if (called) {
        return val;
      }
      called = true;
      return val = fn.apply(this, arguments);
    };
  }

});

module.exports = Sugar.Function.once;