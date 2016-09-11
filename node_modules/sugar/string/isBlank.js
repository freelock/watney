'use strict';

var Sugar = require('sugar-core'),
    trim = require('../common/internal/trim');

Sugar.String.defineInstance({

  'isBlank': function(str) {
    return trim(str).length === 0;
  }

});

module.exports = Sugar.String.isBlank;