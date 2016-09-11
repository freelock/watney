'use strict';

var Sugar = require('sugar-core'),
    assertCallable = require('../../common/internal/assertCallable');

Sugar.Function.defineInstancePolyfill({

  'bind': function(context) {
    // Optimized: no leaking arguments
    var boundArgs = []; for(var $i = 1, $len = arguments.length; $i < $len; $i++) boundArgs.push(arguments[$i]);
    var fn = this, bound;
    assertCallable(this);
    bound = function() {
      // Optimized: no leaking arguments
      var args = []; for(var $i = 0, $len = arguments.length; $i < $len; $i++) args.push(arguments[$i]);
      return fn.apply(fn.prototype && this instanceof fn ? this : context, boundArgs.concat(args));
    };
    bound.prototype = this.prototype;
    return bound;
  }

});

// This package does not export anything as it is mapping a
// polyfill to Function.prototype which cannot be called statically.