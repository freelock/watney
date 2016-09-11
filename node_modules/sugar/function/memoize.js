'use strict';

var Sugar = require('sugar-core'),
    classChecks = require('../common/var/classChecks'),
    deepGetProperty = require('../common/internal/deepGetProperty'),
    collectArguments = require('./internal/collectArguments'),
    createHashedMemoizeFunction = require('./internal/createHashedMemoizeFunction');

var isNumber = classChecks.isNumber,
    isString = classChecks.isString;

Sugar.Function.defineInstance({

  'memoize': function(fn, arg1, arg2) {
    var hashFn, limit, prop;
    if (isNumber(arg1)) {
      limit = arg1;
    } else {
      hashFn = arg1;
      limit  = arg2;
    }
    if (isString(hashFn)) {
      prop = hashFn;
      hashFn = function(obj) {
        return deepGetProperty(obj, prop);
      };
    } else if (!hashFn) {
      hashFn = collectArguments;
    }
    return createHashedMemoizeFunction(fn, hashFn, limit);
  }

});

module.exports = Sugar.Function.memoize;