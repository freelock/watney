'use strict';

var Sugar = require('sugar-core'),
    objectSize = require('./internal/objectSize');

Sugar.Object.defineInstanceAndStatic({

  'isEmpty': function(obj) {
    return objectSize(obj) === 0;
  }

});

module.exports = Sugar.Object.isEmpty;