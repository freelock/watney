'use strict';

var Sugar = require('sugar-core'),
    average = require('../enumerable/internal/average');

Sugar.Object.defineInstanceAndStatic({

  'average': function(obj, map) {
    return average(obj, map);
  }

});

module.exports = Sugar.Object.average;