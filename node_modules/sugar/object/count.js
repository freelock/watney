'use strict';

var Sugar = require('sugar-core'),
    objectCount = require('../enumerable/internal/objectCount');

Sugar.Object.defineInstanceAndStatic({

  'count': function(obj, f) {
    return objectCount(obj, f);
  }

});

module.exports = Sugar.Object.count;