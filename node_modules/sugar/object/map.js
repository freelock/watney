'use strict';

var Sugar = require('sugar-core'),
    objectMap = require('../enumerable/internal/objectMap');

Sugar.Object.defineInstanceAndStatic({

  'map': function(obj, map) {
    return objectMap(obj, map);
  }

});

module.exports = Sugar.Object.map;