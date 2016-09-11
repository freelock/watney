'use strict';

var classChecks = require('../../common/var/classChecks'),
    sanitizeURIComponent = require('./sanitizeURIComponent');

var isDate = classChecks.isDate;

function getURIComponentValue(obj, prefix, transform) {
  var value;
  if (transform) {
    value = transform(obj, prefix);
  } else if (isDate(obj)) {
    value = obj.getTime();
  } else {
    value = obj;
  }
  return sanitizeURIComponent(prefix) + '=' + sanitizeURIComponent(value);
}

module.exports = getURIComponentValue;