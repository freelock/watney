'use strict';

var Sugar = require('sugar-core'),
    clone = require('./internal/clone'),
    mergeAll = require('./internal/mergeAll');

Sugar.Object.defineInstanceAndStatic({

  'addAll': function(obj, sources, opts) {
    return mergeAll(clone(obj), sources, opts);
  }

});

module.exports = Sugar.Object.addAll;