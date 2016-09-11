'use strict';

var getNormalizedIndex = require('./getNormalizedIndex');

function entryAtIndex(obj, index, length, loop, isString) {
  index = getNormalizedIndex(index, length, loop);
  return isString ? obj.charAt(index) : obj[index];
}

module.exports = entryAtIndex;