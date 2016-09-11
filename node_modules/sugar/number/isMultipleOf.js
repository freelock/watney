'use strict';

var Sugar = require('sugar-core'),
    isMultipleOf = require('./internal/isMultipleOf');

Sugar.Number.defineInstance({

  'isMultipleOf': function(n, num) {
    return isMultipleOf(n, num);
  }

});

module.exports = Sugar.Number.isMultipleOf;