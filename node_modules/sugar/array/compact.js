'use strict';

var Sugar = require('sugar-core'),
    arrayCompact = require('./internal/arrayCompact');

Sugar.Array.defineInstance({

  'compact': function(arr, all) {
    return arrayCompact(arr, all);
  }

});

module.exports = Sugar.Array.compact;