'use strict';

function setToArray(set) {
  var arr = new Array(set.size), i = 0;
  set.forEach(function(val) {
    arr[i++] = val;
  });
  return arr;
}

module.exports = setToArray;