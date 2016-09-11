'use strict';

var Sugar = require('sugar-core'),
    objectIntersectOrSubtract = require('./internal/objectIntersectOrSubtract');

Sugar.Object.defineInstanceAndStatic({

  'subtract': function(obj1, obj2) {
    return objectIntersectOrSubtract(obj1, obj2, true);
  }

});

module.exports = Sugar.Object.subtract;