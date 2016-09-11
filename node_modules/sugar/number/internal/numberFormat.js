'use strict';

var classChecks = require('../../common/var/classChecks'),
    mathAliases = require('../../common/var/mathAliases'),
    periodSplit = require('../../common/internal/periodSplit'),
    repeatString = require('../../common/internal/repeatString'),
    withPrecision = require('../../common/internal/withPrecision'),
    _numberOptions = require('../var/_numberOptions');

var isNumber = classChecks.isNumber,
    max = mathAliases.max;

function numberFormat(num, place) {
  var result = '', thousands, decimal, fraction, integer, split, str;

  decimal   = _numberOptions('decimal');
  thousands = _numberOptions('thousands');

  if (isNumber(place)) {
    str = withPrecision(num, place || 0).toFixed(max(place, 0));
  } else {
    str = num.toString();
  }

  str = str.replace(/^-/, '');
  split    = periodSplit(str);
  integer  = split[0];
  fraction = split[1];
  if (/e/.test(str)) {
    result = str;
  } else {
    for(var i = integer.length; i > 0; i -= 3) {
      if (i < integer.length) {
        result = thousands + result;
      }
      result = integer.slice(max(0, i - 3), i) + result;
    }
  }
  if (fraction) {
    result += decimal + repeatString('0', (place || 0) - fraction.length) + fraction;
  }
  return (num < 0 ? '-' : '') + result;
}

module.exports = numberFormat;