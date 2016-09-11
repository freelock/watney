'use strict';

var Sugar = require('sugar-core'),
    arrayIntersectOrSubtract = require('./internal/arrayIntersectOrSubtract');

Sugar.Array.defineInstance({

  'intersect': function(arr1, arr2) {
    return arrayIntersectOrSubtract(arr1, arr2, false);
  }

});

module.exports = Sugar.Array.intersect;