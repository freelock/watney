'use strict';

var Sugar = require('sugar-core'),
    clone = require('./internal/clone');

Sugar.Object.defineInstanceAndStatic({

  'clone': function(obj, deep) {
    return clone(obj, deep);
  }

});

module.exports = Sugar.Object.clone;