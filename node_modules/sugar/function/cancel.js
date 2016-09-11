'use strict';

var Sugar = require('sugar-core'),
    cancelFunction = require('./internal/cancelFunction');

Sugar.Function.defineInstance({

  'cancel': function(fn) {
    return cancelFunction(fn);
  }

});

module.exports = Sugar.Function.cancel;