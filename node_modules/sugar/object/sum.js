'use strict';

var Sugar = require('sugar-core'),
    sum = require('../enumerable/internal/sum');

Sugar.Object.defineInstanceAndStatic({

  'sum': function(obj, map) {
    return sum(obj, map);
  }

});

module.exports = Sugar.Object.sum;