'use strict';

var Sugar = require('sugar-core'),
    isEqual = require('../common/internal/isEqual');

Sugar.Object.defineInstanceAndStatic({

  'isEqual': function(obj1, obj2) {
    return isEqual(obj1, obj2);
  }

});

module.exports = Sugar.Object.isEqual;