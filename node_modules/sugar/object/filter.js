'use strict';

var Sugar = require('sugar-core'),
    objectFilter = require('../enumerable/internal/objectFilter');

Sugar.Object.defineInstanceAndStatic({

  'filter': function(obj, f) {
    return objectFilter(obj, f);
  }

});

module.exports = Sugar.Object.filter;