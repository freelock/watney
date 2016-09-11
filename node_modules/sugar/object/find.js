'use strict';

var Sugar = require('sugar-core'),
    objectMatchers = require('../enumerable/var/objectMatchers');

var objectFind = objectMatchers.objectFind;

Sugar.Object.defineInstanceAndStatic({

  'find': objectFind

});

module.exports = Sugar.Object.find;