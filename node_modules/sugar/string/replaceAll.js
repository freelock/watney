'use strict';

var Sugar = require('sugar-core'),
    stringReplaceAll = require('./internal/stringReplaceAll');

Sugar.String.defineInstanceWithArguments({

  'replaceAll': function(str, f, args) {
    return stringReplaceAll(str, f, args);
  }

});

module.exports = Sugar.String.replaceAll;