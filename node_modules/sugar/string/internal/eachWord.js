'use strict';

var trim = require('../../common/internal/trim'),
    stringEach = require('./stringEach');

function eachWord(str, fn) {
  return stringEach(trim(str), /\S+/g, fn);
}

module.exports = eachWord;