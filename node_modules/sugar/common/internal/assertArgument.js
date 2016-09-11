'use strict';

function assertArgument(exists) {
  if (!exists) {
    throw new TypeError('Argument required');
  }
}

module.exports = assertArgument;