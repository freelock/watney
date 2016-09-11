'use strict';

var Sugar = require('sugar-core'),
    objectReject = require('./internal/objectReject');

Sugar.Object.defineInstanceAndStatic({

  'reject': function(obj, f) {
    return objectReject(obj, f);
  }

});

module.exports = Sugar.Object.reject;