'use strict';

var Sugar = require('sugar-core'),
    clone = require('./internal/clone'),
    mergeWithOptions = require('./internal/mergeWithOptions');

Sugar.Object.defineInstanceAndStatic({

  'add': function(obj1, obj2, opts) {
    return mergeWithOptions(clone(obj1), obj2, opts);
  }

});

module.exports = Sugar.Object.add;