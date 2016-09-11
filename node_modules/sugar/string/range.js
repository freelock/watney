'use strict';

var Sugar = require('sugar-core'),
    PrimitiveRangeConstructor = require('../range/var/PrimitiveRangeConstructor');

Sugar.String.defineStatic({

  'range': PrimitiveRangeConstructor

});

module.exports = Sugar.String.range;