'use strict';

var Sugar = require('sugar-core'),
    numberFormat = require('./internal/numberFormat');

Sugar.Number.defineInstance({

  'format': function(n, place) {
    return numberFormat(n, place);
  }

});

module.exports = Sugar.Number.format;