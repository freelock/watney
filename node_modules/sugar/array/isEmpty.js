'use strict';

var Sugar = require('sugar-core');

Sugar.Array.defineInstance({

  'isEmpty': function(arr) {
    return arr.length === 0;
  }

});

module.exports = Sugar.Array.isEmpty;