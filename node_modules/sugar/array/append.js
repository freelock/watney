'use strict';

var Sugar = require('sugar-core'),
    arrayAppend = require('./internal/arrayAppend');

Sugar.Array.defineInstance({

  'append': function(arr, item, index) {
    return arrayAppend(arr, item, index);
  }

});

module.exports = Sugar.Array.append;