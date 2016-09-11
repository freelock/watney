'use strict';

var isDefined = require('../../common/internal/isDefined'),
    repeatString = require('../../common/internal/repeatString');

function padString(num, padding) {
  return repeatString(isDefined(padding) ? padding : ' ', num);
}

module.exports = padString;