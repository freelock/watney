'use strict';

var Sugar = require('sugar-core'),
    Range = require('../range/internal/Range'),
    rangeClamp = require('../range/internal/rangeClamp');

Sugar.Number.defineInstance({

  'clamp': function(n, start, end) {
    return rangeClamp(new Range(start, end), n);
  }

});

module.exports = Sugar.Number.clamp;