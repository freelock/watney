'use strict';

var trunc = require('../../common/var/trunc'),
    isArrayIndex = require('../../common/internal/isArrayIndex'),
    sparseIndexOf = require('./sparseIndexOf');

function arrayIndexOf(arr, search, fromIndex, fromRight) {
  var length = arr.length, defaultFromIndex, index, increment;

  increment = fromRight ? -1 : 1;
  defaultFromIndex = fromRight ? length - 1 : 0;
  fromIndex = trunc(fromIndex);
  if (!fromIndex && fromIndex !== 0) {
    fromIndex = defaultFromIndex;
  }
  if (fromIndex < 0) {
    fromIndex = length + fromIndex;
  }
  if ((!fromRight && fromIndex < 0) || (fromRight && fromIndex >= length)) {
    fromIndex = defaultFromIndex;
  }

  index = fromIndex;

  while((fromRight && index >= 0) || (!fromRight && index < length)) {
    if (!(index in arr)) {
      return sparseIndexOf(arr, search, fromIndex, fromRight);
    }
    if (isArrayIndex(index) && arr[index] === search) {
      return index;
    }
    index += increment;
  }
  return -1;
}

module.exports = arrayIndexOf;