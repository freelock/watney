'use strict';

var mergeAll = require('./mergeAll');

function defaults(target, sources, opts) {
  opts = opts || {};
  opts.resolve = opts.resolve || false;
  return mergeAll(target, sources, opts);
}

module.exports = defaults;