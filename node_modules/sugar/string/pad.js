'use strict';

var Sugar = require('sugar-core'),
    padString = require('./internal/padString'),
    mathAliases = require('../common/var/mathAliases'),
    coercePositiveInteger = require('../common/internal/coercePositiveInteger');

var max = mathAliases.max,
    ceil = mathAliases.ceil,
    floor = mathAliases.floor;

Sugar.String.defineInstance({

  'pad': function(str, num, padding) {
    var half, front, back;
    num   = coercePositiveInteger(num);
    half  = max(0, num - str.length) / 2;
    front = floor(half);
    back  = ceil(half);
    return padString(front, padding) + str + padString(back, padding);
  }

});

module.exports = Sugar.String.pad;