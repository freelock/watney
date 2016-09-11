'use strict';

var isDefined = require('../../common/internal/isDefined');

function arrayAppend(arr, el, index) {
  var spliceArgs;
  index = +index;
  if (isNaN(index)) {
    index = arr.length;
  }
  spliceArgs = [index, 0];
  if (isDefined(el)) {
    spliceArgs = spliceArgs.concat(el);
  }
  arr.splice.apply(arr, spliceArgs);
  return arr;
}

module.exports = arrayAppend;