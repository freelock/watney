'use strict';

var Sugar = require('sugar-core'),
    isInteger = require('./internal/isInteger');

Sugar.Number.defineInstance({

  'isInteger': function(n) {
    return isInteger(n);
  }

});

module.exports = Sugar.Number.isInteger;