'use strict';

function mapToArray(map) {
  var arr = new Array(map.size), i = 0;
  map.forEach(function(val, key) {
    arr[i++] = [key, val];
  });
  return arr;
}

module.exports = mapToArray;