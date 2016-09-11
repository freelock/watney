'use strict';

var Sugar = require('sugar-core'),
    getValues = require('./internal/getValues');

Sugar.Object.defineInstanceAndStatic({

  'values': function(obj) {
    return getValues(obj);
  }

});

module.exports = Sugar.Object.values;