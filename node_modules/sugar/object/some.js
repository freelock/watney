'use strict';

var Sugar = require('sugar-core'),
    objectMatchers = require('../enumerable/var/objectMatchers');

var objectSome = objectMatchers.objectSome;

Sugar.Object.defineInstanceAndStatic({

  'some': objectSome

});

module.exports = Sugar.Object.some;