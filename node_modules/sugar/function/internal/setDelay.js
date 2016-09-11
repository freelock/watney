'use strict';

var _timers = require('../var/_timers'),
    _canceled = require('../var/_canceled'),
    coercePositiveInteger = require('../../common/internal/coercePositiveInteger');

function setDelay(fn, ms, after, scope, args) {
  // Delay of infinity is never called of course...
  ms = coercePositiveInteger(ms || 0);
  if (!_timers(fn)) {
    _timers(fn, []);
  }
  // This is a workaround for <= IE8, which apparently has the
  // ability to call timeouts in the queue on the same tick (ms?)
  // even if functionally they have already been cleared.
  _canceled(fn, false);
  _timers(fn).push(setTimeout(function() {
    if (!_canceled(fn)) {
      after.apply(scope, args || []);
    }
  }, ms));
}

module.exports = setDelay;