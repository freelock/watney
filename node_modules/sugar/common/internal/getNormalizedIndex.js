'use strict';

function getNormalizedIndex(index, length, loop) {
  if (index && loop) {
    index = index % length;
  }
  if (index < 0) index = length + index;
  return index;
}

module.exports = getNormalizedIndex;