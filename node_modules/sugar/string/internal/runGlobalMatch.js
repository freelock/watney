'use strict';

function runGlobalMatch(str, reg) {
  var result = [], match, lastLastIndex;
  while ((match = reg.exec(str)) != null) {
    if (reg.lastIndex === lastLastIndex) {
      reg.lastIndex += 1;
    } else {
      result.push(match[0]);
    }
    lastLastIndex = reg.lastIndex;
  }
  return result;
}

module.exports = runGlobalMatch;