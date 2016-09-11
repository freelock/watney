'use strict';

var Sugar = require('sugar-core'),
    objectRemove = require('./internal/objectRemove');

Sugar.Object.defineInstanceAndStatic({

  'remove': function(obj, f) {
    return objectRemove(obj, f);
  }

});

module.exports = Sugar.Object.remove;