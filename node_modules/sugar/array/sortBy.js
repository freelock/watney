'use strict';

var Sugar = require('sugar-core'),
    compareValue = require('./internal/compareValue'),
    mapWithShortcuts = require('../common/internal/mapWithShortcuts');

Sugar.Array.defineInstance({

  'sortBy': function(arr, map, desc) {
    arr.sort(function(a, b) {
      var aProperty = mapWithShortcuts(a, map, arr, [a]);
      var bProperty = mapWithShortcuts(b, map, arr, [b]);
      return compareValue(aProperty, bProperty) * (desc ? -1 : 1);
    });
    return arr;
  }

});

module.exports = Sugar.Array.sortBy;