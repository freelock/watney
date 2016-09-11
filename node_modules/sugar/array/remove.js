'use strict';

var Sugar = require('sugar-core'),
    arrayRemove = require('./internal/arrayRemove');

Sugar.Array.defineInstance({

  'remove': function(arr, f) {
    return arrayRemove(arr, f);
  }

});

module.exports = Sugar.Array.remove;