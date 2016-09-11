'use strict';

var Sugar = require('sugar-core'),
    isUndefined = require('../common/internal/isUndefined');

Sugar.String.defineInstance({

  'last': function(str, num) {
    if (isUndefined(num)) num = 1;
    var start = str.length - num < 0 ? 0 : str.length - num;
    return str.substr(start);
  }

});

module.exports = Sugar.String.last;