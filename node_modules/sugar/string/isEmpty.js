'use strict';

var Sugar = require('sugar-core');

Sugar.String.defineInstance({

  'isEmpty': function(str) {
    return str.length === 0;
  }

});

module.exports = Sugar.String.isEmpty;