'use strict';

var objectMatchers = require('../var/objectMatchers');

var objectSome = objectMatchers.objectSome;

function objectNone(obj, f) {
  return !objectSome(obj, f);
}

module.exports = objectNone;