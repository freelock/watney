'use strict';

var Sugar = require('sugar-core'),
    AbbreviationUnits = require('./var/AbbreviationUnits'),
    abbreviateNumber = require('./internal/abbreviateNumber');

var METRIC_UNITS_SHORT = AbbreviationUnits.METRIC_UNITS_SHORT,
    METRIC_UNITS_FULL = AbbreviationUnits.METRIC_UNITS_FULL;

Sugar.Number.defineInstance({

  'metric': function(n, precision, units) {
    if (units === 'all') {
      units = METRIC_UNITS_FULL;
    } else if (!units) {
      units = METRIC_UNITS_SHORT;
    }
    return abbreviateNumber(n, precision, units);
  }

});

module.exports = Sugar.Number.metric;