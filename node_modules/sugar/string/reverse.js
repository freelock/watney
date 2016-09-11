'use strict';

var Sugar = require('sugar-core'),
    reverseString = require('./internal/reverseString');

Sugar.String.defineInstance({

  'reverse': function(str) {
    return reverseString(str);
  }

});

module.exports = Sugar.String.reverse;