'use strict';

var forEach = require('../../common/internal/forEach'),
    classChecks = require('../../common/var/classChecks'),
    mergeWithOptions = require('./mergeWithOptions');

var isArray = classChecks.isArray;

function mergeAll(target, sources, opts) {
  if (!isArray(sources)) {
    sources = [sources];
  }
  forEach(sources, function(source) {
    return mergeWithOptions(target, source, opts);
  });
  return target;
}

module.exports = mergeAll;