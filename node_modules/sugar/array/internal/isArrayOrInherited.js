'use strict';

var classChecks = require('../../common/var/classChecks');

var isArray = classChecks.isArray;

function isArrayOrInherited(obj) {
  return obj && obj.constructor && isArray(obj.constructor.prototype);
}

module.exports = isArrayOrInherited;