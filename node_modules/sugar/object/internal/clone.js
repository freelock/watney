'use strict';

var objectMerge = require('./objectMerge'),
    getNewObjectForMerge = require('./getNewObjectForMerge');

function clone(source, deep) {
  var target = getNewObjectForMerge(source);
  return objectMerge(target, source, deep, true, true, true);
}

module.exports = clone;