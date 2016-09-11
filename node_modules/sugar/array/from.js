'use strict';

var Sugar = require('sugar-core');

Sugar.Array.defineInstance({

  'from': function(arr, num) {
    return arr.slice(num);
  }

});

module.exports = Sugar.Array.from;