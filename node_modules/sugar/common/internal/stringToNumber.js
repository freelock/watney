'use strict';

var CommonChars = require('../var/CommonChars'),
    coreUtilityAliases = require('../var/coreUtilityAliases'),
    fullwidthNumberHelpers = require('../var/fullwidthNumberHelpers');

var fullWidthNumberReg = fullwidthNumberHelpers.fullWidthNumberReg,
    fullWidthNumberMap = fullwidthNumberHelpers.fullWidthNumberMap,
    getOwn = coreUtilityAliases.getOwn,
    HALF_WIDTH_PERIOD = CommonChars.HALF_WIDTH_PERIOD;

function stringToNumber(str, base) {
  var sanitized, isDecimal;
  sanitized = str.replace(fullWidthNumberReg, function(chr) {
    var replacement = getOwn(fullWidthNumberMap, chr);
    if (replacement === HALF_WIDTH_PERIOD) {
      isDecimal = true;
    }
    return replacement;
  });
  return isDecimal ? parseFloat(sanitized) : parseInt(sanitized, base || 10);
}

module.exports = stringToNumber;