'use strict';

function collectArguments() {
  var args = arguments, i = args.length, arr = new Array(i);
  while (i--) {
    arr[i] = args[i];
  }
  return arr;
}

module.exports = collectArguments;