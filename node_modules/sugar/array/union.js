'use strict';

var Sugar = require('sugar-core'),
    arrayUnique = require('./internal/arrayUnique'),
    arrayConcat = require('./internal/arrayConcat');

Sugar.Array.defineInstance({

  'union': function(arr1, arr2) {
    return arrayUnique(arrayConcat(arr1, arr2));
  }

});

module.exports = Sugar.Array.union;