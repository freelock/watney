'use strict';

var Sugar = require('sugar-core'),
    isUndefined = require('../common/internal/isUndefined');

Sugar.Array.defineInstance({

  'to': function(arr, num) {
    if (isUndefined(num)) num = arr.length;
    return arr.slice(0, num);
  }

});

module.exports = Sugar.Array.to;