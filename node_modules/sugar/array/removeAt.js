'use strict';

var Sugar = require('sugar-core'),
    isUndefined = require('../common/internal/isUndefined');

Sugar.Array.defineInstance({

  'removeAt': function(arr, start, end) {
    if (isUndefined(start)) return arr;
    if (isUndefined(end))   end = start;
    arr.splice(start, end - start + 1);
    return arr;
  }

});

module.exports = Sugar.Array.removeAt;