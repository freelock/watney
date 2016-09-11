'use strict';

var Sugar = require('sugar-core'),
    isUndefined = require('../common/internal/isUndefined');

Sugar.Array.defineInstance({

  'first': function(arr, num) {
    if (isUndefined(num)) return arr[0];
    if (num < 0) num = 0;
    return arr.slice(0, num);
  }

});

module.exports = Sugar.Array.first;