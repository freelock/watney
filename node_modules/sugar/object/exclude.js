'use strict';

var Sugar = require('sugar-core'),
    objectExclude = require('./internal/objectExclude');

Sugar.Object.defineInstanceAndStatic({

  'exclude': function(obj, f) {
    return objectExclude(obj, f);
  }

});

module.exports = Sugar.Object.exclude;