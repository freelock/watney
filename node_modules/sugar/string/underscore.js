'use strict';

var Sugar = require('sugar-core'),
    stringUnderscore = require('./internal/stringUnderscore');

Sugar.String.defineInstance({

  'underscore': function(str) {
    return stringUnderscore(str);
  }

});

module.exports = Sugar.String.underscore;