'use strict';

var Sugar = require('sugar-core'),
    isUndefined = require('../common/internal/isUndefined');

Sugar.String.defineInstance({

  'first': function(str, num) {
    if (isUndefined(num)) num = 1;
    return str.substr(0, num);
  }

});

module.exports = Sugar.String.first;