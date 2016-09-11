'use strict';

var Sugar = require('sugar-core'),
    tap = require('./internal/tap');

Sugar.Object.defineInstanceAndStatic({

  'tap': function(obj, arg) {
    return tap(obj, arg);
  }

});

module.exports = Sugar.Object.tap;