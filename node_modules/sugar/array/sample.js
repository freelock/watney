'use strict';

var Sugar = require('sugar-core'),
    trunc = require('../common/var/trunc'),
    arrayClone = require('./internal/arrayClone'),
    classChecks = require('../common/var/classChecks'),
    isUndefined = require('../common/internal/isUndefined'),
    mathAliases = require('../common/var/mathAliases');

var isBoolean = classChecks.isBoolean,
    min = mathAliases.min;

Sugar.Array.defineInstance({

  'sample': function(arr, arg1, arg2) {
    var result = [], num, remove, single;
    if (isBoolean(arg1)) {
      remove = arg1;
    } else {
      num = arg1;
      remove = arg2;
    }
    if (isUndefined(num)) {
      num = 1;
      single = true;
    }
    if (!remove) {
      arr = arrayClone(arr);
    }
    num = min(num, arr.length);
    for (var i = 0, index; i < num; i++) {
      index = trunc(Math.random() * arr.length);
      result.push(arr[index]);
      arr.splice(index, 1);
    }
    return single ? result[0] : result;
  }

});

module.exports = Sugar.Array.sample;