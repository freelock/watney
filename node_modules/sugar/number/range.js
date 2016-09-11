'use strict';

var Sugar = require('sugar-core'),
    PrimitiveRangeConstructor = require('../range/var/PrimitiveRangeConstructor');

Sugar.Number.defineStatic({

  'range': PrimitiveRangeConstructor

});

module.exports = Sugar.Number.range;