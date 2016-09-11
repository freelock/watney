'use strict';

var Sugar = require('sugar-core'),
    stringToNumber = require('../common/internal/stringToNumber');

Sugar.String.defineInstance({

  'toNumber': function(str, base) {
    return stringToNumber(str, base);
  }

});

module.exports = Sugar.String.toNumber;