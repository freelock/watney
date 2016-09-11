'use strict';

var Sugar = require('sugar-core'),
    numberOrIndex = require('./internal/numberOrIndex');

Sugar.String.defineInstance({

  'from': function(str, from) {
    return str.slice(numberOrIndex(str, from, true));
  }

});

module.exports = Sugar.String.from;