'use strict';

var Sugar = require('sugar-core'),
    arrayCreate = require('./internal/arrayCreate');

require('./build/setArrayChainableConstructorCall');

Sugar.Array.defineStatic({

  'create': function(obj, clone) {
    return arrayCreate(obj, clone);
  }

});

module.exports = Sugar.Array.create;