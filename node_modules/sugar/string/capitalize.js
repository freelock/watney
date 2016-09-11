'use strict';

var Sugar = require('sugar-core'),
    stringCapitalize = require('./internal/stringCapitalize');

Sugar.String.defineInstance({

  'capitalize': function(str, lower, all) {
    return stringCapitalize(str, lower, all);
  }

});

module.exports = Sugar.String.capitalize;