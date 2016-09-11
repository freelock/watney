'use strict';

var Sugar = require('sugar-core'),
    isPlainObject = require('../common/internal/isPlainObject');

Sugar.Object.defineInstanceAndStatic({

  'isObject': function(obj) {
    return isPlainObject(obj);
  }

});

module.exports = Sugar.Object.isObject;