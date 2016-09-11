'use strict';

function simpleRepeat(n, fn) {
  for (var i = 0; i < n; i++) {
    fn(i);
  }
}

module.exports = simpleRepeat;