'use strict';

var isDefined = require('../../common/internal/isDefined'),
    getQueryValueAuto = require('./getQueryValueAuto');

function setQueryProperty(obj, key, val, auto, transform) {
  var fnValue;
  if (transform) {
    fnValue = transform(val, key, obj);
  }
  if (isDefined(fnValue)) {
    val = fnValue;
  } else if (auto) {
    val = getQueryValueAuto(obj, key, val);
  }
  obj[key] = val;
}

module.exports = setQueryProperty;