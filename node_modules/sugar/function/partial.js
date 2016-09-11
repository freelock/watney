'use strict';

var Sugar = require('sugar-core'),
    _lock = require('./var/_lock'),
    _partial = require('./var/_partial'),
    isDefined = require('../common/internal/isDefined'),
    classChecks = require('../common/var/classChecks'),
    mathAliases = require('../common/var/mathAliases'),
    isObjectType = require('../common/internal/isObjectType'),
    createInstanceFromPrototype = require('./var/createInstanceFromPrototype');

var isNumber = classChecks.isNumber,
    min = mathAliases.min;

Sugar.Function.defineInstanceWithArguments({

  'partial': function(fn, curriedArgs) {
    var curriedLen = curriedArgs.length;
    var partialFn = function() {
      var argIndex = 0, applyArgs = [], self = this, lock = _lock(partialFn), result, i;
      for (i = 0; i < curriedLen; i++) {
        var arg = curriedArgs[i];
        if (isDefined(arg)) {
          applyArgs[i] = arg;
        } else {
          applyArgs[i] = arguments[argIndex++];
        }
      }
      for (i = argIndex; i < arguments.length; i++) {
        applyArgs.push(arguments[i]);
      }
      if (lock === null) {
        lock = curriedLen;
      }
      if (isNumber(lock)) {
        applyArgs.length = min(applyArgs.length, lock);
      }
      // If the bound "this" object is an instance of the partialed
      // function, then "new" was used, so preserve the prototype
      // so that constructor functions can also be partialed.
      if (self instanceof partialFn) {
        self = createInstanceFromPrototype(fn.prototype);
        result = fn.apply(self, applyArgs);
        // An explicit return value is allowed from constructors
        // as long as they are of "object" type, so return the
        // correct result here accordingly.
        return isObjectType(result) ? result : self;
      }
      return fn.apply(self, applyArgs);
    };
    _partial(partialFn, true);
    return partialFn;
  }

});

module.exports = Sugar.Function.partial;