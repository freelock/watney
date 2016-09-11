'use strict';

var forEach = require('../../common/internal/forEach');

function arrayClone(arr) {
  var clone = new Array(arr.length);
  forEach(arr, function(el, i) {
    clone[i] = el;
  });
  return clone;
}

module.exports = arrayClone;