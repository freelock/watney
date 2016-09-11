'use strict';

var Sugar = require('sugar-core'),
    padNumber = require('../common/internal/padNumber');

Sugar.Number.defineInstance({

  'pad': function(n, place, sign, base) {
    return padNumber(n, place, sign, base);
  }

});

module.exports = Sugar.Number.pad;