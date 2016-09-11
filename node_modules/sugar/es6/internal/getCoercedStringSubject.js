'use strict';

function getCoercedStringSubject(obj) {
  if (obj == null) {
    throw new TypeError('String required.');
  }
  return String(obj);
}

module.exports = getCoercedStringSubject;