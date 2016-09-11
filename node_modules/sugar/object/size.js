'use strict';

var Sugar = require('sugar-core'),
    objectSize = require('./internal/objectSize');

Sugar.Object.defineInstanceAndStatic({

  'size': function(obj) {
    return objectSize(obj);
  }

});

module.exports = Sugar.Object.size;