'use strict';

var Sugar = require('sugar-core'),
    deepHasProperty = require('../common/internal/deepHasProperty');

Sugar.Object.defineInstanceAndStatic({

  'has': function(obj, key, any) {
    return deepHasProperty(obj, key, any);
  }

});

module.exports = Sugar.Object.has;