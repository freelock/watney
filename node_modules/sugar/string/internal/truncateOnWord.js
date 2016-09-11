'use strict';

var TRUNC_REG = require('../var/TRUNC_REG'),
    filter = require('../../common/internal/filter'),
    reverseString = require('./reverseString');

function truncateOnWord(str, limit, fromLeft) {
  if (fromLeft) {
    return reverseString(truncateOnWord(reverseString(str), limit));
  }
  var words = str.split(TRUNC_REG);
  var count = 0;
  return filter(words, function(word) {
    count += word.length;
    return count <= limit;
  }).join('');
}

module.exports = truncateOnWord;