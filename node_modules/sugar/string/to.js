'use strict';

var Sugar = require('sugar-core'),
    isUndefined = require('../common/internal/isUndefined'),
    numberOrIndex = require('./internal/numberOrIndex');

Sugar.String.defineInstance({

  'to': function(str, to) {
    if (isUndefined(to)) to = str.length;
    return str.slice(0, numberOrIndex(str, to));
  }

});

module.exports = Sugar.String.to;