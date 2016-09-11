'use strict';

var getMatcher = require('../../common/internal/getMatcher');

function arrayRemove(arr, f) {
  var matcher = getMatcher(f), i = 0;
  while(i < arr.length) {
    if (matcher(arr[i], i, arr)) {
      arr.splice(i, 1);
    } else {
      i++;
    }
  }
  return arr;
}

module.exports = arrayRemove;