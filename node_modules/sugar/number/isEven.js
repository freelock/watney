'use strict';

var Sugar = require('sugar-core'),
    isMultipleOf = require('./internal/isMultipleOf');

Sugar.Number.defineInstance({

  'isEven': function(n) {
    return isMultipleOf(n, 2);
  }

});

module.exports = Sugar.Number.isEven;