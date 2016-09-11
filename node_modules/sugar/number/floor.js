'use strict';

var Sugar = require('sugar-core'),
    mathAliases = require('../common/var/mathAliases'),
    createRoundingFunction = require('./internal/createRoundingFunction');

var floor = mathAliases.floor;

Sugar.Number.defineInstance({

  'floor': createRoundingFunction(floor)

});

module.exports = Sugar.Number.floor;