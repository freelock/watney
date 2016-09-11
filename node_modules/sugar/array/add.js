'use strict';

var Sugar = require('sugar-core'),
    arrayClone = require('./internal/arrayClone'),
    arrayAppend = require('./internal/arrayAppend');

Sugar.Array.defineInstance({

  'add': function(arr, item, index) {
    return arrayAppend(arrayClone(arr), item, index);
  }

});

module.exports = Sugar.Array.add;