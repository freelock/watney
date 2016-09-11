'use strict';

var Sugar = require('sugar-core'),
    isArguments = require('./internal/isArguments');

Sugar.Object.defineInstanceAndStatic({

  'isArguments': function(obj) {
    return isArguments(obj);
  }

});

module.exports = Sugar.Object.isArguments;