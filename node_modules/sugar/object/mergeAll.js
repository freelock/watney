'use strict';

var Sugar = require('sugar-core'),
    mergeAll = require('./internal/mergeAll');

Sugar.Object.defineInstanceAndStatic({

  'mergeAll': function(target, sources, opts) {
    return mergeAll(target, sources, opts);
  }

});

module.exports = Sugar.Object.mergeAll;