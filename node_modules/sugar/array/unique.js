'use strict';

var Sugar = require('sugar-core'),
    arrayUnique = require('./internal/arrayUnique');

Sugar.Array.defineInstance({

  'unique': function(arr, map) {
    return arrayUnique(arr, map);
  }

});

module.exports = Sugar.Array.unique;