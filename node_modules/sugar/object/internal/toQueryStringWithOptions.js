'use strict';

var isUndefined = require('../../common/internal/isUndefined'),
    toQueryString = require('./toQueryString');

function toQueryStringWithOptions(obj, opts) {
  opts = opts || {};
  if (isUndefined(opts.separator)) {
    opts.separator = '_';
  }
  return toQueryString(obj, opts.deep, opts.transform, opts.prefix || '', opts.separator);
}

module.exports = toQueryStringWithOptions;