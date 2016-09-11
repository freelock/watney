'use strict';

var selectFromObject = require('./selectFromObject');

function objectSelect(obj, f) {
  return selectFromObject(obj, f, true);
}

module.exports = objectSelect;