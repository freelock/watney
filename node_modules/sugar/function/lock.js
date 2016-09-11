'use strict';

var Sugar = require('sugar-core'),
    _lock = require('./var/_lock'),
    _partial = require('./var/_partial'),
    classChecks = require('../common/var/classChecks'),
    mathAliases = require('../common/var/mathAliases');

var isNumber = classChecks.isNumber,
    min = mathAliases.min;

Sugar.Function.defineInstance({

  'lock': function(fn, n) {
    var lockedFn;
    if (_partial(fn)) {
      _lock(fn, isNumber(n) ? n : null);
      return fn;
    }
    lockedFn = function() {
      arguments.length = min(_lock(lockedFn), arguments.length);
      return fn.apply(this, arguments);
    };
    _lock(lockedFn, isNumber(n) ? n : fn.length);
    return lockedFn;
  }

});

module.exports = Sugar.Function.lock;