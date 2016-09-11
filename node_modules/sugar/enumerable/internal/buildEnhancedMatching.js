'use strict';

var enhancedMatching = require('./enhancedMatching'),
    wrapNativeArrayMethod = require('./wrapNativeArrayMethod');

function buildEnhancedMatching(name) {
  return wrapNativeArrayMethod(name, enhancedMatching);
}

module.exports = buildEnhancedMatching;