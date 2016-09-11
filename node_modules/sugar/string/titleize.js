'use strict';

var Sugar = require('sugar-core'),
    stringTitleize = require('./internal/stringTitleize');

Sugar.String.defineInstance({

  'titleize': function(str) {
    return stringTitleize(str);
  }

});

module.exports = Sugar.String.titleize;