'use strict';

var classChecks = require('../var/classChecks');

var isArray = classChecks.isArray;

function assertArray(obj) {
  if (!isArray(obj)) {
    throw new TypeError('Array required');
  }
}

module.exports = assertArray;