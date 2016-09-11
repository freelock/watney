'use strict';

var Sugar = require('sugar-core'),
    assertNonNull = require('../../es5/internal/assertNonNull'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases'),
    coercePrimitiveToObject = require('../../common/internal/coercePrimitiveToObject');

var forEachProperty = coreUtilityAliases.forEachProperty;

Sugar.Object.defineStaticPolyfill({

  'keys': function(obj) {
    var keys = [];
    assertNonNull(obj);
    forEachProperty(coercePrimitiveToObject(obj), function(val, key) {
      keys.push(key);
    });
    return keys;
  }

});

// This package does not export anything as it is mapping a
// polyfill to Object.prototype which cannot be called statically.