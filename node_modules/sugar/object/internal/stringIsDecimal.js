'use strict';

var NON_DECIMAL_REG = require('../var/NON_DECIMAL_REG');

function stringIsDecimal(str) {
  return str !== '' && !NON_DECIMAL_REG.test(str);
}

module.exports = stringIsDecimal;