'use strict';

var Sugar = require('sugar-core'),
    getMinOrMax = require('../enumerable/internal/getMinOrMax');

Sugar.Object.defineInstanceAndStatic({

  'max': function(obj, all, map) {
    return getMinOrMax(obj, all, map, true, true);
  }

});

module.exports = Sugar.Object.max;