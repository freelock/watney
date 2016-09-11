'use strict';

var CommonChars = require('../../common/var/CommonChars');

var HALF_WIDTH_PERIOD = CommonChars.HALF_WIDTH_PERIOD,
    HALF_WIDTH_COMMA = CommonChars.HALF_WIDTH_COMMA;

var NUMBER_OPTIONS = {
  'decimal': HALF_WIDTH_PERIOD,
  'thousands': HALF_WIDTH_COMMA
};

module.exports = NUMBER_OPTIONS;