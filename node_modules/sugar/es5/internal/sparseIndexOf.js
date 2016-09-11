'use strict';

var getSparseArrayIndexes = require('../../common/internal/getSparseArrayIndexes');

function sparseIndexOf(arr, search, fromIndex, fromRight) {
  var indexes = getSparseArrayIndexes(arr, fromIndex, false, fromRight), index;
  indexes.sort(function(a, b) {
    return fromRight ? b - a : a - b;
  });
  while ((index = indexes.shift()) !== undefined) {
    if (arr[index] === search) {
      return +index;
    }
  }
  return -1;
}

module.exports = sparseIndexOf;