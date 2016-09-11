'use strict';

var Sugar = require('sugar-core'),
    coercePositiveInteger = require('../common/internal/coercePositiveInteger');

Sugar.Function.defineInstance({

  'after': function(fn, num) {
    var count = 0, collectedArgs = [];
    num = coercePositiveInteger(num);
    return function() {
      // Optimized: no leaking arguments
      var args = []; for(var $i = 0, $len = arguments.length; $i < $len; $i++) args.push(arguments[$i]);
      collectedArgs.push(args);
      count++;
      if (count >= num) {
        return fn.call(this, collectedArgs);
      }
    };
  }

});

module.exports = Sugar.Function.after;