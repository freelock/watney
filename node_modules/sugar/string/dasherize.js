'use strict';

var Sugar = require('sugar-core'),
    stringUnderscore = require('./internal/stringUnderscore');

Sugar.String.defineInstance({

  'dasherize': function(str) {
    return stringUnderscore(str).replace(/_/g, '-');
  }

});

module.exports = Sugar.String.dasherize;