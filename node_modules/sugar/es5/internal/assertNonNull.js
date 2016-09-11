'use strict';

function assertNonNull(obj) {
  if (obj == null) {
    throw new TypeError('Object required');
  }
}

module.exports = assertNonNull;