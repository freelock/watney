'use strict';

var enhancedMapping = require('./enhancedMapping'),
    wrapNativeArrayMethod = require('./wrapNativeArrayMethod');

function buildEnhancedMapping(name) {
  return wrapNativeArrayMethod(name, enhancedMapping);
}

module.exports = buildEnhancedMapping;