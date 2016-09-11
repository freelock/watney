'use strict';

var Sugar = require('sugar-core'),
    classChecks = require('../../common/var/classChecks');

var isArray = classChecks.isArray;

Sugar.Array.defineStaticPolyfill({

  'isArray': function(obj) {
    return isArray(obj);
  }

});

// This package does not export anything as it is mapping a
// polyfill to Array.prototype which cannot be called statically.