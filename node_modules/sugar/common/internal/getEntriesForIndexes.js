'use strict';

var forEach = require('./forEach'),
    classChecks = require('../var/classChecks'),
    entryAtIndex = require('./entryAtIndex');

var isArray = classChecks.isArray;

function getEntriesForIndexes(obj, find, loop, isString) {
  var result, length = obj.length;
  if (!isArray(find)) {
    return entryAtIndex(obj, find, length, loop, isString);
  }
  result = new Array(find.length);
  forEach(find, function(index, i) {
    result[i] = entryAtIndex(obj, index, length, loop, isString);
  });
  return result;
}

module.exports = getEntriesForIndexes;