'use strict';

var Sugar = require('sugar-core'),
    classChecks = require('../../common/var/classChecks'),
    arrayIndexOf = require('../../es5/internal/arrayIndexOf');

var isString = classChecks.isString;

Sugar.Array.defineInstancePolyfill({

  'lastIndexOf': function(search) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, fromIndex = arguments[1];
    if (isString(this)) return this.lastIndexOf(search, fromIndex);
    return arrayIndexOf(this, search, fromIndex, true);
  }

});

// This package does not export anything as it is mapping a
// polyfill to Array.prototype which cannot be called statically.