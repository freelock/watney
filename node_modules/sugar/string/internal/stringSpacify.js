'use strict';

var stringUnderscore = require('./stringUnderscore');

function stringSpacify(str) {
  return stringUnderscore(str).replace(/_/g, ' ');
}

module.exports = stringSpacify;