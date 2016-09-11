'use strict';

var Sugar = require('sugar-core'),
    getKeys = require('../common/internal/getKeys');

Sugar.Object.defineInstance({

  'keys': function(obj) {
    return getKeys(obj);
  }

});

module.exports = Sugar.Object.keys;