'use strict';

var Sugar = require('sugar-core'),
    deepGetProperty = require('../common/internal/deepGetProperty');

Sugar.Object.defineInstanceAndStatic({

  'get': function(obj, key, any) {
    return deepGetProperty(obj, key, any);
  }

});

module.exports = Sugar.Object.get;