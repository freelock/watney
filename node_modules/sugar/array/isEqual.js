'use strict';

var Sugar = require('sugar-core'),
    isEqual = require('../common/internal/isEqual');

Sugar.Array.defineInstance({

  'isEqual': function(a, b) {
    return isEqual(a, b);
  }

});

module.exports = Sugar.Array.isEqual;