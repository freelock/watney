'use strict';

var Sugar = require('sugar-core'),
    mathAliases = require('../common/var/mathAliases'),
    getOrdinalSuffix = require('../common/internal/getOrdinalSuffix');

var abs = mathAliases.abs;

Sugar.Number.defineInstance({

  'ordinalize': function(n) {
    var num = abs(n), last = +num.toString().slice(-2);
    return n + getOrdinalSuffix(last);
  }

});

module.exports = Sugar.Number.ordinalize;