'use strict';

var objectMerge = require('./objectMerge');

function mergeWithOptions(target, source, opts) {
  opts = opts || {};
  return objectMerge(target, source, opts.deep, opts.resolve, opts.hidden, opts.descriptor);
}

module.exports = mergeWithOptions;