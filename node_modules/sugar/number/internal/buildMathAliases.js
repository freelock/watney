'use strict';

var namespaceAliases = require('../../common/var/namespaceAliases'),
    defineInstanceSimilar = require('../../common/internal/defineInstanceSimilar');

var sugarNumber = namespaceAliases.sugarNumber;

function buildMathAliases() {
  defineInstanceSimilar(sugarNumber, 'abs pow sin asin cos acos tan atan exp pow sqrt', function(methods, name) {
    methods[name] = function(n, arg) {
      // Note that .valueOf() here is only required due to a
      // very strange bug in iOS7 that only occurs occasionally
      // in which Math.abs() called on non-primitive numbers
      // returns a completely different number (Issue #400)
      return Math[name](n.valueOf(), arg);
    };
  });
}

module.exports = buildMathAliases;