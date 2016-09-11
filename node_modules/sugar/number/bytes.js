'use strict';

var Sugar = require('sugar-core'),
    AbbreviationUnits = require('./var/AbbreviationUnits'),
    abbreviateNumber = require('./internal/abbreviateNumber');

var MEMORY_UNITS = AbbreviationUnits.MEMORY_UNITS,
    MEMORY_BINARY_UNITS = AbbreviationUnits.MEMORY_BINARY_UNITS;

Sugar.Number.defineInstance({

  'bytes': function(n, precision, binary, units) {
    if (units === 'binary' || (!units && binary)) {
      units = MEMORY_BINARY_UNITS;
    } else if(units === 'si' || !units) {
      units = MEMORY_UNITS;
    }
    return abbreviateNumber(n, precision, units, binary) + 'B';
  }

});

module.exports = Sugar.Number.bytes;