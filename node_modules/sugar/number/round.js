'use strict';

var Sugar = require('sugar-core'),
    mathAliases = require('../common/var/mathAliases'),
    createRoundingFunction = require('./internal/createRoundingFunction');

var round = mathAliases.round;

Sugar.Number.defineInstance({

  'round': createRoundingFunction(round)

});

module.exports = Sugar.Number.round;