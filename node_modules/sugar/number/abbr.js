'use strict';

var Sugar = require('sugar-core'),
    AbbreviationUnits = require('./var/AbbreviationUnits'),
    abbreviateNumber = require('./internal/abbreviateNumber');

var BASIC_UNITS = AbbreviationUnits.BASIC_UNITS;

Sugar.Number.defineInstance({

  'abbr': function(n, precision) {
    return abbreviateNumber(n, precision, BASIC_UNITS);
  }

});

module.exports = Sugar.Number.abbr;