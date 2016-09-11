'use strict';

var Sugar = require('sugar-core'),
    setDelay = require('./internal/setDelay');

Sugar.Function.defineInstanceWithArguments({

  'every': function(fn, ms, args) {
    function execute () {
      // Set the delay first here, so that cancel
      // can be called within the executing function.
      setDelay(fn, ms, execute);
      fn.apply(fn, args);
    }
    setDelay(fn, ms, execute);
    return fn;
  }

});

module.exports = Sugar.Function.every;