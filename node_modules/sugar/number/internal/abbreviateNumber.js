'use strict';

var commaSplit = require('../../common/internal/commaSplit'),
    mathAliases = require('../../common/var/mathAliases'),
    numberFormat = require('./numberFormat'),
    withPrecision = require('../../common/internal/withPrecision');

var abs = mathAliases.abs,
    pow = mathAliases.pow,
    min = mathAliases.min,
    max = mathAliases.max,
    floor = mathAliases.floor;

function abbreviateNumber(num, precision, ustr, bytes) {
  var fixed        = num.toFixed(20),
      decimalPlace = fixed.search(/\./),
      numeralPlace = fixed.search(/[1-9]/),
      significant  = decimalPlace - numeralPlace,
      units, unit, mid, i, divisor;
  if (significant > 0) {
    significant -= 1;
  }
  units = commaSplit(ustr);
  if (units.length === 1) {
    units = ustr.split('');
  }
  mid = units.indexOf('|');
  if (mid === -1) {
    // Skipping the placeholder means the units should start from zero,
    // otherwise assume they end at zero.
    mid = units[0] === '_' ? 0 : units.length;
  }
  i = max(min(floor(significant / 3), units.length - mid - 1), -mid);
  unit = units[i + mid];
  while (unit === '_') {
    i += i < 0 ? -1 : 1;
    unit = units[i + mid];
  }
  if (unit === '|') {
    unit = '';
  }
  if (significant < -9) {
    precision = abs(significant) - 9;
  }
  divisor = bytes ? pow(2, 10 * i) : pow(10, i * 3);
  return numberFormat(withPrecision(num / divisor, precision || 0)) + unit;
}

module.exports = abbreviateNumber;