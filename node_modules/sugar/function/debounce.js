'use strict';

var Sugar = require('sugar-core'),
    setDelay = require('./internal/setDelay'),
    cancelFunction = require('./internal/cancelFunction');

Sugar.Function.defineInstance({

  'debounce': function(fn, ms) {
    function debounced() {
      // Optimized: no leaking arguments
      var args = []; for(var $i = 0, $len = arguments.length; $i < $len; $i++) args.push(arguments[$i]);
      cancelFunction(debounced);
      setDelay(debounced, ms, fn, this, args);
    }
    return debounced;
  }

});

module.exports = Sugar.Function.debounce;