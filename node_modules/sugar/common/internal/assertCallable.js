'use strict';

var classChecks = require('../var/classChecks');

var isFunction = classChecks.isFunction;

function assertCallable(obj) {
  if (!isFunction(obj)) {
    throw new TypeError('Function is not callable');
  }
}

module.exports = assertCallable;