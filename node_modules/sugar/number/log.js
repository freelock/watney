'use strict';

var Sugar = require('sugar-core');

Sugar.Number.defineInstance({

  'log': function(n, base) {
    return Math.log(n) / (base ? Math.log(base) : 1);
  }

});

module.exports = Sugar.Number.log;