'use strict';

var Sugar = require('sugar-core'),
    arrayClone = require('./internal/arrayClone');

Sugar.Array.defineInstance({

  'clone': function(arr) {
    return arrayClone(arr);
  }

});

module.exports = Sugar.Array.clone;