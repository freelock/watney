'use strict';

var Sugar = require('sugar-core'),
    objectSelect = require('./internal/objectSelect');

Sugar.Object.defineInstanceAndStatic({

  'select': function(obj, f) {
    return objectSelect(obj, f);
  }

});

module.exports = Sugar.Object.select;