'use strict';

var Sugar = require('sugar-core'),
    mathAliases = require('../common/var/mathAliases'),
    createRoundingFunction = require('./internal/createRoundingFunction');

var ceil = mathAliases.ceil;

Sugar.Number.defineInstance({

  'ceil': createRoundingFunction(ceil)

});

module.exports = Sugar.Number.ceil;