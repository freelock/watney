'use strict';

var Sugar = require('sugar-core'),
    defaults = require('./internal/defaults');

Sugar.Object.defineInstanceAndStatic({

  'defaults': function(target, sources, opts) {
    return defaults(target, sources, opts);
  }

});

module.exports = Sugar.Object.defaults;