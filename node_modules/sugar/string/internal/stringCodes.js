'use strict';

function stringCodes(str, fn) {
  var codes = new Array(str.length), i, len;
  for(i = 0, len = str.length; i < len; i++) {
    var code = str.charCodeAt(i);
    codes[i] = code;
    if (fn) {
      fn.call(str, code, i, str);
    }
  }
  return codes;
}

module.exports = stringCodes;