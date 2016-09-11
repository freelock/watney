'use strict';

var isEqual = require('./isEqual');

function defaultMatcher(f) {
  return function(el) {
    return isEqual(el, f);
  };
}

module.exports = defaultMatcher;