'use strict';

var Sugar = require('sugar-core'),
    toQueryStringWithOptions = require('./internal/toQueryStringWithOptions');

Sugar.Object.defineInstanceAndStatic({

  'toQueryString': function(obj, options) {
    return toQueryStringWithOptions(obj, options);
  }

});

module.exports = Sugar.Object.toQueryString;