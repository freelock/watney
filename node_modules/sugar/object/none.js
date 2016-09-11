'use strict';

var Sugar = require('sugar-core'),
    objectNone = require('../enumerable/internal/objectNone');

Sugar.Object.defineInstanceAndStatic({

  'none': function(obj, f) {
    return objectNone(obj, f);
  }

});

module.exports = Sugar.Object.none;