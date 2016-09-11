'use strict';

var CAPITALIZE_REG = require('../var/CAPITALIZE_REG'),
    simpleCapitalize = require('../../common/internal/simpleCapitalize');

function stringCapitalize(str, downcase, all) {
  if (downcase) {
    str = str.toLowerCase();
  }
  return all ? str.replace(CAPITALIZE_REG, simpleCapitalize) : simpleCapitalize(str);
}

module.exports = stringCapitalize;