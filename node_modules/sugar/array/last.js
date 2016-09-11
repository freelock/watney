'use strict';

var Sugar = require('sugar-core'),
    isUndefined = require('../common/internal/isUndefined');

Sugar.Array.defineInstance({

  'last': function(arr, num) {
    if (isUndefined(num)) return arr[arr.length - 1];
    var start = arr.length - num < 0 ? 0 : arr.length - num;
    return arr.slice(start);
  }

});

module.exports = Sugar.Array.last;