'use strict';

var Sugar = require('sugar-core'),
    fromQueryStringWithOptions = require('./internal/fromQueryStringWithOptions');

Sugar.Object.defineStatic({

  'fromQueryString': function(obj, options) {
    return fromQueryStringWithOptions(obj, options);
  }

});

module.exports = Sugar.Object.fromQueryString;