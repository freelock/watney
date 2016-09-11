'use strict';

var HALF_WIDTH_NINE = require('../var/HALF_WIDTH_NINE'),
    FULL_WIDTH_NINE = require('../var/FULL_WIDTH_NINE'),
    CommonChars = require('../../common/var/CommonChars');

var HALF_WIDTH_ZERO = CommonChars.HALF_WIDTH_ZERO,
    FULL_WIDTH_ZERO = CommonChars.FULL_WIDTH_ZERO;

function codeIsNumeral(code) {
  return (code >= HALF_WIDTH_ZERO && code <= HALF_WIDTH_NINE) ||
         (code >= FULL_WIDTH_ZERO && code <= FULL_WIDTH_NINE);
}

module.exports = codeIsNumeral;