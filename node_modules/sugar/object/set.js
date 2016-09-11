'use strict';

var Sugar = require('sugar-core'),
    deepSetProperty = require('../common/internal/deepSetProperty');

Sugar.Object.defineInstanceAndStatic({

  'set': function(obj, key, val) {
    return deepSetProperty(obj, key, val);
  }

});

module.exports = Sugar.Object.set;