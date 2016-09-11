'use strict';

var Sugar = require('sugar-core'),
    padString = require('./internal/padString'),
    mathAliases = require('../common/var/mathAliases'),
    coercePositiveInteger = require('../common/internal/coercePositiveInteger');

var max = mathAliases.max;

Sugar.String.defineInstance({

  'padRight': function(str, num, padding) {
    num = coercePositiveInteger(num);
    return str + padString(max(0, num - str.length), padding);
  }

});

module.exports = Sugar.String.padRight;