'use strict';

var Sugar = require('sugar-core'),
    isInteger = require('./internal/isInteger'),
    isMultipleOf = require('./internal/isMultipleOf');

Sugar.Number.defineInstance({

  'isOdd': function(n) {
    return isInteger(n) && !isMultipleOf(n, 2);
  }

});

module.exports = Sugar.Number.isOdd;