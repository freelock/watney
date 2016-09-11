'use strict';

var Sugar = require('sugar-core'),
    padNumber = require('../common/internal/padNumber');

Sugar.Number.defineInstance({

  'hex': function(n, pad) {
    return padNumber(n, pad || 1, false, 16);
  }

});

module.exports = Sugar.Number.hex;