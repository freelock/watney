'use strict';

var Sugar = require('sugar-core'),
    getLeastOrMost = require('../enumerable/internal/getLeastOrMost');

Sugar.Object.defineInstanceAndStatic({

  'least': function(obj, all, map) {
    return getLeastOrMost(obj, all, map, false, true);
  }

});

module.exports = Sugar.Object.least;