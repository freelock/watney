'use strict';

var Sugar = require('sugar-core'),
    getLeastOrMost = require('../enumerable/internal/getLeastOrMost');

Sugar.Object.defineInstanceAndStatic({

  'most': function(obj, all, map) {
    return getLeastOrMost(obj, all, map, true, true);
  }

});

module.exports = Sugar.Object.most;