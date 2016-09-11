'use strict';

var Sugar = require('sugar-core'),
    objectMatchers = require('../enumerable/var/objectMatchers');

var objectEvery = objectMatchers.objectEvery;

Sugar.Object.defineInstanceAndStatic({

  'every': objectEvery

});

module.exports = Sugar.Object.every;