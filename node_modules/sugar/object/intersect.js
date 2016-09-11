'use strict';

var Sugar = require('sugar-core'),
    objectIntersectOrSubtract = require('./internal/objectIntersectOrSubtract');

Sugar.Object.defineInstanceAndStatic({

  'intersect': function(obj1, obj2) {
    return objectIntersectOrSubtract(obj1, obj2, false);
  }

});

module.exports = Sugar.Object.intersect;