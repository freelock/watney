'use strict';

var Sugar = require('sugar-core'),
    stringReplaceAll = require('./internal/stringReplaceAll');

Sugar.String.defineInstance({

  'removeAll': function(str, f) {
    return stringReplaceAll(str, f);
  }

});

module.exports = Sugar.String.removeAll;