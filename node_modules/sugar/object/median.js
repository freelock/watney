'use strict';

var Sugar = require('sugar-core'),
    median = require('../enumerable/internal/median');

Sugar.Object.defineInstanceAndStatic({

  'median': function(obj, map) {
    return median(obj, map);
  }

});

module.exports = Sugar.Object.median;