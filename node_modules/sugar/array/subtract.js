'use strict';

var Sugar = require('sugar-core'),
    arrayIntersectOrSubtract = require('./internal/arrayIntersectOrSubtract');

Sugar.Array.defineInstance({

  'subtract': function(arr, item) {
    return arrayIntersectOrSubtract(arr, item, true);
  }

});

module.exports = Sugar.Array.subtract;