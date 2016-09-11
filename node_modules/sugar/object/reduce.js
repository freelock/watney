'use strict';

var Sugar = require('sugar-core'),
    objectReduce = require('../enumerable/internal/objectReduce');

Sugar.Object.defineInstanceAndStatic({

  'reduce': function(obj, fn, init) {
    return objectReduce(obj, fn, init);
  }

});

module.exports = Sugar.Object.reduce;