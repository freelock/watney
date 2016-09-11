'use strict';

var _timers = require('../var/_timers'),
    _canceled = require('../var/_canceled'),
    classChecks = require('../../common/var/classChecks');

var isArray = classChecks.isArray;

function cancelFunction(fn) {
  var timers = _timers(fn), timer;
  if (isArray(timers)) {
    while(timer = timers.shift()) {
      clearTimeout(timer);
    }
  }
  _canceled(fn, true);
  return fn;
}

module.exports = cancelFunction;