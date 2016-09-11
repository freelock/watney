'use strict';

var setDelay = require('./setDelay'),
    mathAliases = require('../../common/var/mathAliases');

var max = mathAliases.max,
    ceil = mathAliases.ceil,
    round = mathAliases.round;

function createLazyFunction(fn, ms, immediate, limit) {
  var queue = [], locked = false, execute, rounded, perExecution, result;
  ms = ms || 1;
  limit = limit || Infinity;
  rounded = ceil(ms);
  perExecution = round(rounded / ms) || 1;
  execute = function() {
    var queueLength = queue.length, maxPerRound;
    if (queueLength == 0) return;
    // Allow fractions of a millisecond by calling
    // multiple times per actual timeout execution
    maxPerRound = max(queueLength - perExecution, 0);
    while(queueLength > maxPerRound) {
      // Getting uber-meta here...
      result = Function.prototype.apply.apply(fn, queue.shift());
      queueLength--;
    }
    setDelay(lazy, rounded, function() {
      locked = false;
      execute();
    });
  };
  function lazy() {
    // If the execution has locked and it's immediate, then
    // allow 1 less in the queue as 1 call has already taken place.
    if (queue.length < limit - (locked && immediate ? 1 : 0)) {
      // Optimized: no leaking arguments
      var args = []; for(var $i = 0, $len = arguments.length; $i < $len; $i++) args.push(arguments[$i]);
      queue.push([this, args]);
    }
    if (!locked) {
      locked = true;
      if (immediate) {
        execute();
      } else {
        setDelay(lazy, rounded, execute);
      }
    }
    // Return the memoized result
    return result;
  }
  return lazy;
}

module.exports = createLazyFunction;