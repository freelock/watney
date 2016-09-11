'use strict';

var Sugar = require('sugar-core');

Sugar.Number.defineInstance({

  'toNumber': function(n) {
    return n.valueOf();
  }

});

module.exports = Sugar.Number.toNumber;