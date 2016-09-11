'use strict';

var Sugar = require('sugar-core'),
    Range = require('../range/internal/Range'),
    rangeClamp = require('../range/internal/rangeClamp');

Sugar.Number.defineInstance({

  'cap': function(n, max) {
    return rangeClamp(new Range(undefined, max), n);
  }

});

module.exports = Sugar.Number.cap;