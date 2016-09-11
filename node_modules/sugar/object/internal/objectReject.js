'use strict';

var selectFromObject = require('./selectFromObject');

function objectReject(obj, f) {
  return selectFromObject(obj, f, false);
}

module.exports = objectReject;