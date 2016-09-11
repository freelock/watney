'use strict';

var Sugar = require('sugar-core'),
    trunc = require('../common/var/trunc'),
    mathAliases = require('../common/var/mathAliases'),
    isUndefined = require('../common/internal/isUndefined');

var min = mathAliases.min,
    max = mathAliases.max;

Sugar.Number.defineStatic({

  'random': function(n1, n2) {
    var minNum, maxNum;
    if (arguments.length == 1) n2 = n1, n1 = 0;
    minNum = min(n1 || 0, isUndefined(n2) ? 1 : n2);
    maxNum = max(n1 || 0, isUndefined(n2) ? 1 : n2) + 1;
    return trunc((Math.random() * (maxNum - minNum)) + minNum);
  }

});

module.exports = Sugar.Number.random;