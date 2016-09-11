'use strict';

var Sugar = require('sugar-core'),
    mergeWithOptions = require('./internal/mergeWithOptions');

Sugar.Object.defineInstanceAndStatic({

  'merge': function(target, source, opts) {
    return mergeWithOptions(target, source, opts);
  }

});

module.exports = Sugar.Object.merge;