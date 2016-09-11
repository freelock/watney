'use strict';

function regexMatcher(reg) {
  reg = RegExp(reg);
  return function(el) {
    return reg.test(el);
  };
}

module.exports = regexMatcher;