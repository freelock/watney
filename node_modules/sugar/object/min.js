'use strict';

var Sugar = require('sugar-core'),
    getMinOrMax = require('../enumerable/internal/getMinOrMax');

Sugar.Object.defineInstanceAndStatic({

  'min': function(obj, all, map) {
    return getMinOrMax(obj, all, map, false, true);
  }

});

module.exports = Sugar.Object.min;