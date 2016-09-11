'use strict';

var Sugar = require('sugar-core'),
    isObjectType = require('../common/internal/isObjectType'),
    stringFormatMatcher = require('./var/stringFormatMatcher');

Sugar.String.defineInstanceWithArguments({

  'format': function(str, args) {
    var arg1 = args[0] && args[0].valueOf();
    // Unwrap if a single object is passed in.
    if (args.length === 1 && isObjectType(arg1)) {
      args = arg1;
    }
    return stringFormatMatcher(str, args);
  }

});

module.exports = Sugar.String.format;