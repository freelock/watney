'use strict';

var Sugar = require('sugar-core'),
    chr = require('../common/var/chr'),
    stringCodes = require('./internal/stringCodes');

Sugar.String.defineInstance({

  'shift': function(str, n) {
    var result = '';
    n = n || 0;
    stringCodes(str, function(c) {
      result += chr(c + n);
    });
    return result;
  }

});

module.exports = Sugar.String.shift;