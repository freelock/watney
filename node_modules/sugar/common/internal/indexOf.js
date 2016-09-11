'use strict';

function indexOf(arr, el) {
  for (var i = 0, len = arr.length; i < len; i++) {
    if (i in arr && arr[i] === el) return i;
  }
  return -1;
}

module.exports = indexOf;