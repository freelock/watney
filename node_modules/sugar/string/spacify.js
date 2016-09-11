'use strict';

var Sugar = require('sugar-core'),
    stringSpacify = require('./internal/stringSpacify');

Sugar.String.defineInstance({

  'spacify': function(str) {
    return stringSpacify(str);
  }

});

module.exports = Sugar.String.spacify;