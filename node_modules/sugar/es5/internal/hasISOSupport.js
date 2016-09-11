'use strict';

function hasISOSupport() {
  var d = new Date(Date.UTC(2000, 0));
  return !!d.toISOString && d.toISOString() === '2000-01-01T00:00:00.000Z';
}

module.exports = hasISOSupport;